import { User, getAllWorkspaceUsers } from './slack';
import Airtable from 'airtable';

interface Volunteer {
    slackId: string
    name: string
    title?: string
    phone?: string
    profilePictureUrl?: string
}

const isRegularUser: (_: User) => boolean = (user) => {
    return !user.deleted && !user.is_bot && user.id !== 'USLACKBOT'
}

function slackUserToVolunteer(user: User): Volunteer {

    const filterEmpties = (s: string | undefined) => {
        return (s != null && s !== "") ? s : undefined
    }

    return {
        name: user.real_name,
        slackId: user.id,
        title: filterEmpties(user.profile.title),
        phone: filterEmpties(user.profile.phone),
        profilePictureUrl: filterEmpties(user.profile.image_original)
    }
}

function envOrDie(key: string): string {
    const val = process.env[key]
    if (val == null) {
        throw `Please define the ${key} env variable.`
    }
    return val
}

const main = async () => {

    const slackToken = envOrDie("SLACK_API_TOKEN")
    const airtableToken = envOrDie("AIRTABLE_API_TOKEN")

    const users = (await getAllWorkspaceUsers(slackToken)).filter(isRegularUser)
    const volunteers = users.map(slackUserToVolunteer)

    console.log(`Downloaded ${users.length} regular users.`)

    const airtable = new Airtable({apiKey: airtableToken}).base('app98Yx4PLPDr68df')
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

main()