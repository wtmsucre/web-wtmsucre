import { describe, expect, mock, test } from "bun:test"
import { getUser } from "../src/lib/services/profileService"

function clientFor(user, error = null) {
  return { auth: { getUser: mock(async () => ({ data: { user }, error })) } }
}

describe("request authentication", () => {
  test("components reuse middleware validation after headers have been sent", async () => {
    const user = { id: "new-user" }
    const client = clientFor(user)
    expect(await getUser(client)).toBe(user)

    client.auth.getUser.mockImplementation(() => {
      throw new Error("Cannot change cookies after streaming starts")
    })
    const users = await Promise.all([getUser(client), getUser(client)])
    expect(users).toEqual([user, user])
    expect(client.auth.getUser).toHaveBeenCalledTimes(1)
  })

  test("an invalid session is cleared only once, before rendering", async () => {
    const client = clientFor(null, { message: "Session expired" })
    expect(await getUser(client)).toBeNull()
    expect(await getUser(client)).toBeNull()
    expect(client.auth.getUser).toHaveBeenCalledTimes(1)
  })

  test("concurrent lookups share validation but separate requests never share users", async () => {
    const first = clientFor({ id: "first-user" })
    const second = clientFor({ id: "second-user" })
    const anonymous = clientFor(null)
    const users = await Promise.all([
      getUser(first),
      getUser(first),
      getUser(second),
      getUser(anonymous),
    ])
    expect(users.map(user => user?.id ?? null)).toEqual([
      "first-user",
      "first-user",
      "second-user",
      null,
    ])
    expect(first.auth.getUser).toHaveBeenCalledTimes(1)
  })
})
