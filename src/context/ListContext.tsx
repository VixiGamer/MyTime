import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { List as ListType} from "../Types/List";
import type { Show } from "../Types/SearchShow";

type ListContextType = {
  lists: ListType[];
  addList: (name: string) => void;
  removeList: (listId: number) => void;
  addShowToList: (listId: number, show: Show) => void;
  removeShowFromList: (listId: number, showId: number) => void;
};

const ListContext = createContext<ListContextType | null>(null);

export function ListProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<ListType[]>(() => {
    const saved = localStorage.getItem("myLists");
    return saved ? JSON.parse(saved) : [];
  });

  // 🔹 Salva nel localStorage
  useEffect(() => {
    localStorage.setItem("myLists", JSON.stringify(lists));
  }, [lists]);

  const addList = (name: string) => {
    if (!name.trim()) return;

    setLists((prev) => {
      if (prev.some((l) => l.listName === name)) {
        alert("List name already exists");
        return prev;
      }

      const newList: ListType = {
        listId: lists.length + 1, // id unico
        listName: name,
        shows: []
      };

      return [...prev, newList];
    });
  };

  const removeList = (listId: number) => {
    if (!window.confirm("Are you sure you want to delete this list?")) return;
    setLists((prev) => prev.filter((list) => list.listId !== listId));
  };

  const addShowToList = (listId: number, show: Show) => {
    setLists((prev) =>
      prev.map((list) => {
        if (list.listId !== listId) return list;

        // evita duplicati
        //^ Per sicurezza, visto che gia il bottone viene disabilitato
        if (list.shows.some((s) => s.id === show.id)) {
          alert("Show already in list");
          return list;
        }
        //^^^^^^^^

        return {
          ...list,
          shows: [...list.shows, show]
        };
      })
    );
  };

  const removeShowFromList = (listId: number, showId: number) => {
    setLists((prev) =>
      prev.map((list) =>
        list.listId === listId
          ? {
              ...list,
              shows: list.shows.filter((show) => show.id !== showId)
            }
          : list
      )
    );
  };

  return (
    <ListContext.Provider
      value={{
        lists,
        addList,
        removeList,
        addShowToList,
        removeShowFromList
      }}
    >
      {children}
    </ListContext.Provider>
  );
}

export function useList() {
  const context = useContext(ListContext);
  if (!context) {
    throw new Error("useList must be used inside ListProvider");
  }
  return context;
}