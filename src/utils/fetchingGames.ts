import axios from "axios"
import { id } from "zod/locales"

const RAWG_API_KEY = process.env.RAWG_KEY
const RAWG_BASE_URL = "https://api.rawg.io/api"
const GAMES_TO_FETCH = 500
const GAMES_PER_REQUEST = 40
const DELAY_BETWEEN_REQUESTS = 1000
export const fetchingGameFromApi = async (id: number) => {
  try {
    const response = await axios.get(`${RAWG_BASE_URL}/genres`, {
      params: {
        key: RAWG_API_KEY,
      },
    })
    console.log(response.data)
  } catch (e) {
    console.log(e)
  }
}
fetchingGameFromApi(3498)
