import { createContext } from "react";
import type { List as ListType } from "../../Types/List";
import type { Show } from "../../Types/SearchShow";

type ListContextType = {
  lists: ListType[];
  addList: (name: string) => void;
  removeList: (listId: number) => void;
  addShowToList: (listId: number, show: Show) => void;
  removeShowFromList: (listId: number, showId: number) => void;
};

export const ListContext = createContext<ListContextType | null>(null);

