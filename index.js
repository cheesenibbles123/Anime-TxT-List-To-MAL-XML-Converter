const fs = require("fs");
const config = JSON.parse(fs.readFileSync("config.json", {encoding: "utf8"}));

console.log("Loading text file...");
let file = fs.readFileSync(config.ListFileName, "utf8");
if (!file) {
    console.log("Unable to load text file!");
    return;
}
file = file.replaceAll("\n", "").replaceAll("\r", "");
console.log("Found text file:", config.ListFileName + ".");

const entries = file.split(config.SplitCharacter);
const skippedTitles = [];

async function parseEntries(entries) {
    let xml = `<myanimelist>
        <myinfo>
            <user_id>${config.UserId}</user_id>
            <user_name>${config.Username}</user_name>
            <user_export_type>1</user_export_type>
        </myinfo>
    `;
    console.log("Found", entries.length, "total entries.");
    console.log("Set skipping of Plan To Watch to", config.SkipPlannedToWatch + ".");

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const components = entry.split(config.EntryDataDivider);
        const title = components[0];
        console.log(`Proccessing: ${i + 1}/${entries.length},`, title + ".");

        const status = convertStatus(components[3]);
        if (status === "Plan To Watch" && config.SkipPlannedToWatch) {
            console.warn("Skipping", title, "as it's status is 'Plan To Watch'");
            continue;
        }

        try {
            let id = await getIdByTitleFromJinkan(title);
            if (!id.retry) {
                const score = components[1];
                const epWatched = getEpWatchedFromInput(components[2]);
                const date = components[4];
        
                xml += makeIntoXml(id.value, epWatched, status, date, score);
            }
        } catch (e) {
            setTimeout(async () => {
                try {
                    console.log("Retrying", title + ".");
                    id = await getIdByTitleFromJinkan(title);
                    console.log("Retry Success for", title + ".");

                    const score = components[1];
                    const epWatched = getEpWatchedFromInput(components[2]);
                    const date = components[4];
            
                    xml += makeIntoXml(id, epWatched, status, date, score);
                } catch(er) {
                    console.warn("Failed Retry for", title + ".");
                    skippedTitles.push(title);
                }
            }, 1100);
        }

        await new Promise((resolve, reject) => {
            setTimeout(resolve, 1100);
        });
    }

    xml += "</myanimelist>";
    fs.writeFileSync("output.xml", xml);
    console.log("Skipped entries", skippedTitles);
}

parseEntries(entries);

function getIdByTitleFromJinkan(title) {
    const params = new URLSearchParams();
    params.append("q", title);
    params.append("limit", 1);

    return fetch("https://api.jikan.moe/v4/anime?" + params).then(async (response) => {
        if (response.status == 400) {
            console.log("Bad request for", "https://api.jikan.moe/v4/anime?" + params);
            throw new Error ( {
                retry: false,
                value: -1
            });
        } else if (response.status == 429) {
            console.log("Rate limited!!!!");
            throw new Error({
                retry: true,
                value: -1
            });
        } else {
            return response.json();
        }
    }).then((jsonData) => {
        if (!jsonData || !jsonData.data[0]) {
            throw new Error({
                retry: false,
                value: -1
            });
        }

        return {
            retry: false,
            value: jsonData?.data[0]?.mal_id ?? -1
        }
    });
}

function convertStatus(inStatus) {
    switch (inStatus) {
        case config.StatusText.PlannedToWatch:
            return "Plan To Watch";
        case config.StatusText.Completed:
            return "Completed";
        case config.StatusText.Dropped:
            return "Dropped";
        case config.StatusText.Watching:
            return "Watching";
        case config.StatusText.OnHold:
            return "On Hold";
        default:
            return "";
    }
}

function getEpWatchedFromInput(input) {
    if (input.indexOf("/") === -1 && input.indexOf("\\") === -1) {
        return input;
    }
    return input.split(" ")[0];
}

function makeIntoXml(id, epWatched, status, date, score) {
    return `
        <anime>
            <series_animedb_id>${id}</series_animedb_id>
            <my_watched_episodes>${isNaN(epWatched) ? 0 : epWatched}</my_watched_episodes>
            <my_start_date>${date}</my_start_date>
            <my_finish_date>${date}</my_finish_date>
            <my_rated></my_rated>
            <my_score>${isNaN(score) ? 0 : score}</my_score>
            <my_storage></my_storage>
            <my_storage_value>0.00</my_storage_value>
            <my_status>${status}</my_status>
            <my_comments><![CDATA[]]></my_comments>
            <my_times_watched>0</my_times_watched>
            <my_rewatch_value></my_rewatch_value>
            <my_priority>LOW</my_priority>
            <my_tags><![CDATA[]]></my_tags>
            <my_rewatching>0</my_rewatching>
            <my_rewatching_ep>0</my_rewatching_ep>
            <my_discuss>1</my_discuss>
            <my_sns>default</my_sns>
            <update_on_import>1</update_on_import>
        </anime>
    `;
}