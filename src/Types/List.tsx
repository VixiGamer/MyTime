import type { Show } from "./SearchShow"


export interface List {
    listId: number
    listName: string
    shows: Show[]
}
