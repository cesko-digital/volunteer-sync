import * as slack from 'slack';

interface CustomField {
    value?: string
    alt?: string
    label?: string
}

interface CustomFieldHash {
    [key: string]: CustomField
}

export interface UserProfile {
    email?: string
    title?: string
    phone?: string
    is_custom_image?: boolean
    image_original?: string
    fields?: CustomFieldHash
}

export interface User {
    id: string
    name: string
    real_name: string
    profile: UserProfile
    deleted: boolean
    is_bot: boolean
}

export interface ResponseMetadata {
    next_cursor?: string
}

export interface UserListResponse {
    members: User[]
    response_metadata: ResponseMetadata
}

export interface Volunteer {
    slackId: string
    name: string
    title?: string
    phone?: string
    email?: string
    profilePictureUrl?: string
    weeklyAvalability?: string
}

export async function getAllWorkspaceUsers(token: string): Promise<User[]> {
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

export async function getWeeklyAvailability(token: string, slackId: string): Promise<string | null> {

    interface Response {
        profile: UserProfile
    }

    const availabilityFieldTag = "XfNQG9GG77"
    const response = await slack.users.profile.get({token, user: slackId}) as unknown as Response
    const customFields = response.profile.fields ?? {}

    return customFields[availabilityFieldTag]?.value ?? null
}

export function slackUserToVolunteer(user: User): Volunteer {

    const filterEmpties = (s: string | undefined) => {
        return (s != null && s !== "") ? s : undefined
    }

    return {
        name: user.real_name,
        slackId: user.id,
        title: filterEmpties(user.profile.title),
        phone: filterEmpties(user.profile.phone),
        email: filterEmpties(user.profile.email),
        profilePictureUrl: filterEmpties(user.profile.image_original)
    }
}
