import Airtable from 'airtable';
import { Volunteer } from './slack';

export async function getVolunteerAirTableId(table: Airtable.Table<{}>, slackId: string): Promise<string | null> {
    const filter = `SEARCH("${slackId}", {slackId})`
    const query = table.select({
        filterByFormula: filter,
        fields: ["slackId"],
    })
    const matches = await query.firstPage()
    return (matches.length > 0) ?
        matches[0].id :
        null
}

export async function saveToAirTable(apiToken: string, volunteers: Volunteer[]) {

    const table = new Airtable({apiKey: apiToken}).base('app98Yx4PLPDr68df')('Volunteers')

    var count = 1

    for (const volunteer of volunteers) {
        try {
            const slackId = volunteer.slackId
            const existingId = await getVolunteerAirTableId(table, slackId)
            if (existingId != null) {
                console.log(`Updating existing user “${slackId}”, record ${count}/${volunteers.length}.`)
                await table.update(existingId, volunteer)
            } else {
                console.log(`Inserting new user “${slackId}”, record ${count}/${volunteers.length}.`)
                await table.create(volunteer)
            }
        } catch (err) {
            console.error(err)
        }
        count++
    }
}
