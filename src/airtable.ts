import Airtable from 'airtable';
import { Volunteer } from './slack';

export async function saveToAirTable(apiToken: string, volunteers: Volunteer[]) {

    const table = new Airtable({apiKey: apiToken}).base('app98Yx4PLPDr68df')('Volunteers')
    var count = 1

    for (const volunteer of volunteers) {
        try {
            const filter = `SEARCH("${volunteer.slackId}", {slackId})`
            const query = table.select({
                filterByFormula: filter,
                fields: ["slackId"],
            })
            const matches = await query.firstPage()
            if (matches.length > 0) {
                const existing = matches[0]
                console.log(`Updating existing user “${volunteer.slackId}”, record ${count}/${volunteers.length}.`)
                await table.update(existing.id, volunteer)
            } else {
                console.log(`Inserting new user “${volunteer.slackId}”, record ${count}/${volunteers.length}.`)
                await table.create(volunteer)
            }
        } catch (err) {
            console.error(err)
        }
        count++
    }
}
