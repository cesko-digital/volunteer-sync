import * as slack from 'slack';

export interface UserProfile {
    email?: string
    title?: string
    phone?: string
    is_custom_image?: boolean
    image_original?: string
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
