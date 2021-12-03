import React, { useEffect, useState } from "react";
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
import { getRxSBrowserIdbStorage } from "atroo-browser-storage";
const {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} = require("unique-names-generator");
// addPouchPlugin(require("pouchdb-adapter-indexeddb"));

let locked = false;

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

      setDatabase(database);
    })();
  }, []);

  useEffect(() => {
    if (!database) {
      return;
    }

    const coll = database.heroes;

    const id = coll.schema.getPrimaryOfDocumentData({
      name: "fat_puma",
      color: "harlequin",
    });

    coll
      .find({
        limit: 100,
        selector: {
          // color: {
          //   $gt: "academic_dingo",
          //   $lt: "nursing_sloth",
          //   // $exists: true,
          // },
          // secret: {
          //   $gt: "crude_anteater",
          //   $lt: "fit_salmon",
          //   // $exists: true,
          // },
          name: {
            $gt: "bottom_bovid",
          },
        },
        sort: [{ name: "desc" }],
      })
      .$.subscribe((docs) => {
        setDocs(() => {
          return docs;
        });
      });

    // coll.findOne(id).$.subscribe((data) => {
    //   console.log("Found by id: ", data.toJSON());
    // });
  }, [database]);

  useEffect(() => {
    (async () => {
      if (docs?.length && !locked) {
        locked = true;
        const doc: RxDocument = docs[0];
        await doc.putAttachment({
          id: "cat.jpg",
          data: new Blob(["cat"]),
          type: "hey",
        });
        doc.allAttachments$.subscribe((attachments) =>
          console.log("All attachments", attachments)
        );

        const catAttachment = await doc.getAttachment("cat.jpg");
        console.log("catATtachment:", catAttachment);
        const attachmentData = await catAttachment?.getStringData();
        console.log("Attachment data: ", attachmentData);
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
