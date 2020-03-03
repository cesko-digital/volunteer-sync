import { User, getAllWorkspaceUsers, slackUserToVolunteer } from './slack';
import { saveToAirTable } from './airtable';

const isRegularUser: (_: User) => boolean = (user) => {
    return !user.deleted && !user.is_bot && user.id !== 'USLACKBOT'
}

const hasTitle: (_: User) => boolean = (user) => {
    return user.profile.title != null && user.profile.title !== ""
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

    console.log("Downloading Slack users.")

    const allUsers = await getAllWorkspaceUsers(slackToken)
    const regularUsers = allUsers.filter(isRegularUser)
    const volunteers = regularUsers
        .filter(hasTitle)
        .map(slackUserToVolunteer)

    console.log(`Downloaded ${regularUsers.length} regular users (${allUsers.length} total), saving to AirTable.`)

    await saveToAirTable(airtableToken, volunteers)
}

main()