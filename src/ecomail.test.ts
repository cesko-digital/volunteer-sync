import { Volunteer } from "./slack";
import { buildSubscriberData } from "./ecomail";

test("Convert volunteers to subscribers", () => {
  const vs: Volunteer[] = [
    {
      slackId: "foo",
      name: "John Doe",
      email: "john@doe.name"
    },
    {
      slackId: "bar",
      name: "Anonymous"
    }
  ];
  expect(buildSubscriberData(vs)).toEqual({
    subscriber_data: [{ email: "john@doe.name" }],
    update_existing: false
  });
});
