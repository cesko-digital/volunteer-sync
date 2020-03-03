import Airtable from 'airtable';
import { Volunteer } from './slack';

export async function saveToAirTable(apiToken: string, volunteers: Volunteer[]) {

    const airtable = new Airtable({apiKey: apiToken}).base('app98Yx4PLPDr68df')
    const batchSize = 10
    var batchId = 0

    while (true) {
        var batch = volunteers.splice(0, batchSize)
        if (batch.length == 0) {
            break
        }
        console.log(`Inserting to AirTable: batch #${batchId}, ${batch.length} records.`)
        try {
            const toRecord = (v: Volunteer) => { return { fields: v } }
            await airtable('Volunteers').create(batch.map(toRecord))
        } catch (err) {
            console.log(err)
        }
        batchId++
    }
}
