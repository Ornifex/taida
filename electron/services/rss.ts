import Parser from 'rss-parser';
import fetch from 'node-fetch';
import stringSimilarity from 'string-similarity';

function normalize(str: string): string {
  return str.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findBestMapKey(animeEntry: any, titleMap: Map<string, any>, threshold = 0.7) {
    const titleVariants = [
        animeEntry.title.romaji,
        animeEntry.title.english,
        animeEntry.title.native,
        ...Array.isArray(animeEntry.title.synonyms) ? animeEntry.title.synonyms : []
    ].filter(Boolean);

    let bestMatch: { rating: number; key: string | null } = { rating: 0, key: null };

    for (const [mapKey, _] of titleMap) {
        const normalizedMapTitle = normalize(mapKey);

        for (const title of titleVariants) {
            const normalizedTitle = normalize(title);
            const similarity = stringSimilarity.compareTwoStrings(
                normalizedTitle,
                normalizedMapTitle
            );
            
            if (similarity > bestMatch.rating) {
                bestMatch = { rating: similarity, key: mapKey };
            }
            
            if (similarity === 1) break;
        }
    }

    return bestMatch.rating >= threshold ? bestMatch : null;
}

function mergeAnimeData(animeList: any[], titleMap: Map<string, any>): any[] {
    const results = new Map(titleMap);

    const mergedIds = new Set();

    for (const anime of animeList) {
        const match = findBestMapKey(anime, titleMap);
        if (
            match &&
            match.key !== null &&
            anime &&
            !mergedIds.has(anime.id)
        ) {
            const existingData = results.get(match.key);

            results.set(match.key, {
                ...existingData,
                ...anime,
                matchedConfidence: match.rating,
            });

            mergedIds.add(anime.id);
        }
    }

    return Array.from(results.values()).filter(
        (item, idx, arr) =>
            arr.findIndex(other => other.id === item.id) === idx
    );
}

async function fetchTorrentsFromRss(rssUrl: string): Promise<any[]> {
    const parser = new Parser();

    try {
        const feed = await parser.parseURL(rssUrl);
        return feed.items; 
    } catch (error) {
        console.error('Failed to parse RSS:', error);
        return [];
    }
}

async function getCurrentSeasonAnimeTorrents(): Promise<Map<string, any>> {
    const rssUrl = 'https://subsplease.org/rss/?r=720'
    const torrents = await fetchTorrentsFromRss(rssUrl);
    const shows = new Map();

    torrents.forEach(item => {
        const match = item.title.match(/^\[.+?\]\s*(.+?)\s*-\s*(\d+)/);
        if (match && match[1]) {
            const showName = match[1];
            const episodeNumber = parseInt(match[2]);
            const episodeLink = item.link;

            if (!shows.has(showName)) {
                shows.set(showName, {
                    name: showName,
                    episodeList: [{ number: episodeNumber, link: episodeLink }], 
                });
                // MANUAL OVERRIDE FOR BISQUE DOLL
                if (showName.includes("Bisque")) {
                    shows.set(showName, {
                        name: showName,
                        episodeList: [{ number: episodeNumber - 12, link: episodeLink }],
                    });
                }
            } else {
                const show = shows.get(showName);
                const episodeExists = show.episodeList.some((ep: { number: number; }) => ep.number === episodeNumber);
                if (!episodeExists) {
                    show.episodeList.push({ number: episodeNumber, link: episodeLink });
                    shows.set(showName, show);
                }
            }
        }
    })

    return shows;
}

async function getCurrentSeasonAnime(pages: number = 3) {
    const now = new Date();
    const year = now.getFullYear();

    const month = now.getMonth() + 1;
    let season = 'WINTER';
    if (month >= 3 && month <= 5) season = 'SPRING';
    else if (month >= 6 && month <= 8) season = 'SUMMER';
    else if (month >= 9 && month <= 11) season = 'FALL';

    const query = `
        query ($seasonYear: Int, $page: Int) {
            Page(page: $page, perPage: 50) {
                media(seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC) {
                    id
                    idMal
                    title { romaji english native }
                    format
                    status
                    description
                    startDate { year month day }
                    endDate { year month day }
                    season
                    seasonYear
                    episodes
                    duration            
                    trailer { id site thumbnail }        
                    coverImage { large }
                    bannerImage
                    genres
                    synonyms
                    averageScore
                    popularity
                    studios { edges { node { name } } }
                    nextAiringEpisode { airingAt timeUntilAiring episode }
                    siteUrl
                }
            }
        }
    `;

    let allMedia: any[] = [];
    for (let page = 1; page <= pages; page++) {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: {
                    season: season,
                    seasonYear: year,
                    page: page,
                },
            }),
        });

        const json = await response.json() as {
            data?: { Page: { media: any[] } },
            errors?: any
        };

        if (json.errors) {
            console.error('AniList API error:', json.errors);
            continue;
        }

        allMedia = allMedia.concat(json.data?.Page.media ?? []);
    }

    return allMedia;
};

export default async function getCurrentSeasonAnimeWithTorrents() {
    const animeList = await getCurrentSeasonAnime();
    const torrentList = await getCurrentSeasonAnimeTorrents();

    const mergedMap = mergeAnimeData(animeList, torrentList);

    return mergedMap;
};