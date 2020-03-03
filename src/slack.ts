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
