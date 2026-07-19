import { z } from "zod"
import { getMinecraftServerStatus, InvalidMinecraftServerAddressError, InvalidMinecraftStatusTargetsError, parseMinecraftStatusTargets } from "../utils/minecraft-status"

const querySchema = z.object({
  address: z.string().trim().min(1).max(253),
})

export default defineEventHandler(async (event) => {
  const { address } = await getValidatedQuery(event, querySchema.parse)
  try {
    const { minecraftStatusTargets } = useRuntimeConfig(event)
    return await getMinecraftServerStatus(address, parseMinecraftStatusTargets(minecraftStatusTargets))
  } catch (error) {
    if (error instanceof InvalidMinecraftServerAddressError)
      throw createError({ statusCode: 400, statusMessage: "Invalid Minecraft server address" })
    if (error instanceof InvalidMinecraftStatusTargetsError) {
      console.error("Invalid NUXT_MINECRAFT_STATUS_TARGETS configuration", error)
      throw createError({ statusCode: 500, statusMessage: "Server status is misconfigured" })
    }
    throw error
  }
})
