import * as slack from 'slack';
import { writeFileSync } from 'fs';

interface CustomUserField {
    value?: string
    label?: string
}

interface CustomUserFieldHash {
    [key: string]: CustomUserField
}

interface UserProfile {
    email?: string
    title?: string
    phone?: string
    fields?: CustomUserFieldHash
    is_custom_image?: boolean
    image_original?: string
}

interface User {
    id: string
    name: string
    real_name: string
    profile: UserProfile
    deleted: boolean
    is_bot: boolean
}

interface ResponseMetadata {
    next_cursor?: string
}

interface UserListResponse {
    members: User[]
    response_metadata: ResponseMetadata
}

interface Volunteer {
    slackId: string
    name: string
    title?: string
    phone?: string
    profilePictureUrl?: string
}

async function getAllWorkspaceUsers(token: string): Promise<User[]> {
    var users: User[] = []
    var cursor = ""
    do {
        console.log(`Getting list of workspace users, cursor “${cursor}”.`)
        const response = await slack.users.list({token, cursor}) as unknown as UserListResponse
        users.push(...response.members)
        cursor = response?.response_metadata?.next_cursor ?? ""
    } while (cursor != "")
    return users
}

const isRegularUser: (_: User) => boolean = (user) => {
    return !user.deleted && !user.is_bot && user.id !== 'USLACKBOT'
}

function slackUserToVolunteer(user: User): Volunteer {

    const filterEmpties = (s: string | undefined) => {
        return (s != null && s !== "") ? s : undefined
    }

    return {
        slackId: user.id,
        name: user.real_name,
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
    const token: string = envOrDie("SLACK_API_TOKEN")
    const users = (await getAllWorkspaceUsers(token)).filter(isRegularUser)
    const toJSON = (s: any) => JSON.stringify(s, null, 2)
    writeFileSync("slack-users.json", toJSON(users))
    writeFileSync("volunteers.json", toJSON(users.map(slackUserToVolunteer)))
}

main()