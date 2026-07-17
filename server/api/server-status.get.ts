import { z } from "zod"
import { getMinecraftServerStatus, InvalidMinecraftServerAddressError } from "../utils/minecraft-status"

const querySchema = z.object({
  address: z.string().trim().min(1).max(253),
})

export default defineEventHandler(async (event) => {
  const { address } = await getValidatedQuery(event, querySchema.parse)
  try {
    return await getMinecraftServerStatus(address)
  } catch (error) {
    if (error instanceof InvalidMinecraftServerAddressError)
      throw createError({ statusCode: 400, statusMessage: "Invalid Minecraft server address" })
    throw error
  }
})
