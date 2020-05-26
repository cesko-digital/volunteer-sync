import { Volunteer } from "./slack";
import axios from "axios";

interface Subscriber {
  email: string;
}

interface SubscriberData {
  subscriber_data: Subscriber[];
  update_existing: boolean;
}

export function buildSubscriberData(volunteers: Volunteer[]): SubscriberData {
  const subs: Subscriber[] = volunteers
    .filter(v => v.email != null)
    .map(v => {
      return {
        email: v.email!
      };
    });
  return {
    subscriber_data: subs,
    update_existing: false
  };
}

export async function uploadSubscribers(
  apiKey: string,
  volunteers: Volunteer[]
): Promise<any> {
  return axios({
    method: "post",
    url: "http://api2.ecomailapp.cz/lists/2/subscribe-bulk",
    data: buildSubscriberData(volunteers),
    headers: {
      key: apiKey
    }
  });
}
