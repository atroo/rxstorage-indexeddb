import React, { useEffect, useState } from "react";
import "./App.css";
import {
  // addPouchPlugin,
  createRxDatabase,
  // getRxStoragePouch,
  RxDatabase,
  // RxDocument,
} from "rxdb";
// import { getRxStorageLoki } from "rxdb/plugins/lokijs";
import { heroSchema } from "./schemas/hero-schema";
import { getRxSBrowserIdbStorage } from "atroo-browser-storage";
const {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} = require("unique-names-generator");
// addPouchPlugin(require("pouchdb-adapter-indexeddb"));

function App() {
  const [database, setDatabase] = useState<RxDatabase | null>(null);
  const [docs, setDocs] = useState<any[]>();

  useEffect(() => {
    (async () => {
      const database = await createRxDatabase({
        name: "mydatabase",
        // storage: getRxStorageLoki(),
        storage: getRxSBrowserIdbStorage(),
        // storage: getRxStoragePouch("indexeddb"),
      });

      await database.addCollections({
        heroes: {
          schema: heroSchema,
          migrationStrategies: {
            1: function (oldDoc) {
              console.log("oldDoc", oldDoc);
              oldDoc.myVersion = 1;
              return oldDoc;
            },
          },
        },
      });

      console.dir(database.heroes.name);
      setDatabase(database);
    })();
  }, []);

  useEffect(() => {
    if (!database) {
      return;
    }

    const coll = database.heroes;
    console.log("heroes collection:", coll);

    console.log("find is dispatched");
    coll.find().$.subscribe((docs) => {
      setDocs(() => {
        return docs;
      });
    });
  }, [database]);

  return (
    <div className="App">
      <button
        onClick={async () => {
          if (!database) {
            return;
          }
          const coll = database.heroes;
          const q = coll.find({
            selector: {
              name: { $gt: "mario" },
              birthyear: { $lt: 2020 },
              color: { $exists: true },
            },
          });

          var res = await q.exec();
          console.log("search res:", res);
        }}
      >
        RUN QUERY
      </button>
      <button
        onClick={() => {
          const randomName = uniqueNamesGenerator({
            dictionaries: [adjectives, animals],
          });
          const randomColor = uniqueNamesGenerator({ dictionaries: [colors] });
          database?.heroes.upsert({
            name: randomName,
            color: randomColor,
            birthyear: 2021,
          });
        }}
      >
        Created document
      </button>
      <ol>
        {docs?.map((d) => {
          const json = d.toJSON();
          return (
            <li key={json.name}>
              <span>{JSON.stringify(json)}</span>
              <button
                onClick={() => {
                  d.atomicUpdate((oldData: any) => {
                    oldData.color = uniqueNamesGenerator({
                      dictionaries: [colors],
                    });

                    return oldData;
                  });
                }}
              >
                New Color
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default App;
