import * as slack from "slack";

interface CustomField {
  value?: string;
  alt?: string;
  label?: string;
}

interface CustomFieldHash {
  [key: string]: CustomField;
}

/** A subset of the Profile object from the Slack API */
export interface UserProfile {
  email?: string;
  title?: string;
  phone?: string;
  image_original?: string;
  fields?: CustomFieldHash;
}

/** A subset of the User object from the Slack API */
export interface User {
  id: string;
  name: string;
  real_name: string;
  profile: UserProfile;
  deleted: boolean;
  is_bot: boolean;
}

/**
 * Our custom object for storing basic volunteer info
 *
 * The fields are populated from `User` and `UserProfile`.
 */
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

/** A subset of the Message object from the Slack API */
export interface Message {
  type: string;
  user: string;
  text: string;
  ts: string;
}

/** A paging helper to get all pages from a paged Slack API call */
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

/** Return all users from a given Slack workspace */
export async function getAllWorkspaceUsers(token: string): Promise<User[]> {
  return getAllPages(
    cursor => slack.users.list({ token, cursor }),
    response => response.members,
    response => response?.response_metadata?.next_cursor
  );
}

/** Return all messages from a given Slack channel */
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

/** Return the weekly availability custom field from our Slack user’s profile */
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

/** Pick fields from a `User` object into a `Volunteer` object */
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
