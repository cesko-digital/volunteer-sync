import * as slack from "slack";

interface CustomField {
  value?: string;
  alt?: string;
  label?: string;
}

interface CustomFieldHash {
  [key: string]: CustomField;
}

export interface UserProfile {
  email?: string;
  title?: string;
  phone?: string;
  image_original?: string;
  fields?: CustomFieldHash;
}

export interface User {
  id: string;
  name: string;
  real_name: string;
  profile: UserProfile;
  deleted: boolean;
  is_bot: boolean;
}

export interface Volunteer {
  slackId: string;
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  profilePictureUrl?: string;
  weeklyAvailability?: string;
  introPost?: string;
}

export interface Message {
  type: string;
  user: string;
  text: string;
  ts: string;
}

async function getAllPages<Value, Response>(
  getPage: (cursor: string) => Promise<Response>,
  extractItems: (response: Response) => Value[],
  nextPage: (response: Response) => string | undefined
): Promise<Value[]> {
  var items: Value[] = [];
  var cursor = "";
  var page = 1;

  do {
    console.log(`Retrieving page ${page}, cursor “${cursor}”.`);
    const response = await getPage(cursor);
    items.push(...extractItems(response));
    cursor = nextPage(response) ?? "";
    page++;
  } while (cursor != "");

  return items;
}

export async function getAllWorkspaceUsers(token: string): Promise<User[]> {
  return getAllPages(
    cursor => slack.users.list({ token, cursor }),
    response => response.members,
    response => response?.response_metadata?.next_cursor
  );
}

export async function getCompleteChannelHistory(
  token: string,
  channel: string
): Promise<Message[]> {
  return getAllPages(
    cursor => slack.conversations.history({ token, cursor, channel }),
    response => response.messages,
    response => response?.response_metadata?.next_cursor
  );
}

export async function getWeeklyAvailability(
  token: string,
  slackId: string
): Promise<string | null> {
  interface Response {
    profile: UserProfile;
  }

  const availabilityFieldTag = "XfNQG9GG77";
  const response = ((await slack.users.profile.get({
    token,
    user: slackId
  })) as unknown) as Response;
  const customFields = response.profile.fields ?? {};

  return customFields[availabilityFieldTag]?.value ?? null;
}

export function slackUserToVolunteer(user: User): Volunteer {
  const filterEmpties = (s: string | undefined) => {
    return s != null && s !== "" ? s : undefined;
  };

  return {
    name: user.real_name,
    slackId: user.id,
    title: filterEmpties(user.profile.title),
    phone: filterEmpties(user.profile.phone),
    email: filterEmpties(user.profile.email),
    profilePictureUrl: filterEmpties(user.profile.image_original)
  };
}
