import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import {
  // addPouchPlugin,
  createRxDatabase,
  // getRxStoragePouch,
  RxDatabase,
  RxDocument,
  // RxDocument,
} from "rxdb";
// import { getRxStorageLoki } from "rxdb/plugins/lokijs";
import { heroSchema } from "./schemas/hero-schema";
import { getRxIdbStorage } from "atroo-browser-storage";
import { heroSchema1 } from "./schemas/hero-schema-1";
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
        storage: getRxIdbStorage({
          blocking: () => {
            alert("Blocking");
          },
        }),
        // storage: getRxStoragePouch("indexeddb"),
      });

      await database.addCollections({
        heroes1: {
          schema: heroSchema1,
        },
        heroes: {
          schema: heroSchema,
          migrationStrategies: {
            1: function (oldDoc) {
              console.log("oldDoc", oldDoc);
              oldDoc.myVersion = 1;
              return oldDoc;
            },
            2: function (oldDoc) {
              console.log("oldDoc1", oldDoc);
              oldDoc.myVersion1 = 2;
              return oldDoc;
            },
            3: function (oldDoc) {
              return oldDoc;
            },
          },
        },
      });

      setDatabase(database);
    })();
  }, []);

  useEffect(() => {
    if (!database) {
      return;
    }

    const coll = database.heroes;
    const coll1 = database.heroes1;

    const heroes1Data = coll1.find().exec();
    console.log("heroes1Data:", heroes1Data);

    // const id = coll.schema.getPrimaryOfDocumentData({
    //   name: "fat_puma",
    //   color: "harlequin",
    // });

    coll
      .find({
        limit: 100,
        selector: {
          // color: {
          //   $gte: "coral",
          //   $lte: "maroon",
          //   // $exists: true,
          // },
          // secret: {
          //   $gte: "definite_marsupial",
          //   $lte: "grumpy_fox",
          //   // $eq: "vague_cardinal",
          //   // $exists: true,
          // },
          // // name: {
          // //   $gt: "chubby_hippopotamus",
          // //   $exists: true,
          // // },
        },
        sort: [{ color: "desc" }],
      })
      .$.subscribe((docs) => {
        setDocs(() => {
          return docs;
        });
      });

    (async () => {
      const localDoc = await coll.upsertLocal(
        "foobar", // id
        {
          // data
          foo: "bar",
        }
      );
      console.log("upserted local doc", localDoc);

      const reqLocalDoc = await coll.getLocal("foobar");
      console.log("req local document: ", reqLocalDoc);
    })();

    // coll.findOne(id).$.subscribe((data) => {
    //   console.log("Found by id: ", data.toJSON());
    // });
  }, [database]);

  const hasMountedRef = useRef(false);
  useEffect(() => {
    (async () => {
      if (docs?.length && !hasMountedRef.current) {
        hasMountedRef.current = true;
        const doc: RxDocument = docs[0];
        await doc.putAttachment({
          id: "cat.jpg",
          data: new Blob(["cat"]),
          type: "hey",
        });

        const catAttachment = await doc.getAttachment("cat.jpg");
        console.log("catATtachment:", catAttachment);
      }
    })();
  }, [docs]);

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
            secret: uniqueNamesGenerator({
              dictionaries: [adjectives, animals],
            }),
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
