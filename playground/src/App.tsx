import React, { useEffect, useState } from "react";
import "./App.css";
import {
  addPouchPlugin,
  createRxDatabase,
  getRxStoragePouch,
  RxDatabase,
  RxDocument,
} from "rxdb";
import { getRxStorageLoki } from "rxdb/plugins/lokijs";
import { heroSchema } from "./schemas/hero-schema";
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
        storage: getRxStorageLoki(),
      });

      await database.addCollections({
        heroes: {
          schema: heroSchema,
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
    coll.find().$.subscribe((docs) => {
      setDocs(() => {
        return docs;
      });
    });
  }, [database]);

  useEffect(() => {
    const dbreq = window.indexedDB.open("MyTestDatabase");
    dbreq.onerror = function (event) {
      // Do something with request.errorCode!
      console.error("Database error: " + dbreq.error);
    };
    dbreq.onsuccess = function (event) {
      // Do something with request.result!
      console.log("success", event);
    };

    // This event is only implemented in recent browsers
    dbreq.onupgradeneeded = function (event) {
      const customerData = [
        {
          ssn: "444-44-4444",
          name: "Bill",
          age: 35,
          email: "bill@company.com",
        },
        { ssn: "555-55-5555", name: "Donna", age: 32, email: "donna@home.org" },
      ];

      // Save the IDBDatabase interface
      const db = dbreq.result;

      // Create an objectStore for this database
      const objectStore = db.createObjectStore("customers", { keyPath: "ssn" });

      // Create an index to search customers by name. We may have duplicates
      // so we can't use a unique index.
      objectStore.createIndex("name", "name", { unique: false });

      // Create an index to search customers by email. We want to ensure that
      // no two customers have the same email, so use a unique index.
      objectStore.createIndex("email", "email", { unique: true });

      objectStore.transaction.oncomplete = function (event) {
        // Store values in the newly created objectStore.
        const customerObjectStore = db
          .transaction("customers", "readwrite")
          .objectStore("customers");
        customerData.forEach((customer) => {
          customerObjectStore.add(customer);
        });
      };

      // ----

      const objStore = db.createObjectStore("names", { autoIncrement: true });
      // Because the "names" object store has the key generator, the key for the name value is generated automatically.
      // The added records would be like:
      // key : 1 => value : "Bill"
      // key : 2 => value : "Donna"
      customerData.forEach(function (customer) {
        objStore.add(customer.name);
      });
    };
  }, []);

  return (
    <div className="App">
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
