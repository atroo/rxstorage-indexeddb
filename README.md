
# RxStorage for Indexeddb

## Archived

This repository is not maintained and the storage is superseeded by storages for the browser directly available from rxdb. Please check these out.

## Background

This storage is build to be used by RxDB. It uses native Indexeddb Indexes, `idb` module as thin wrapper around Indexeddb. We lended logic from pouchdb-find to plan and execute queries and aim to support the same set of operators. Operators like regex are being process in-memory and cannot take advantage of indexes.

## Features

- [x] RxAttachments
- [x] RxLocalDocs

## Compatibility

| RxDB  | RxStorage Indexeddb |
| ----- | ------------------- |
| 11.x  | 1.x  |

## Installation

```
npm install rx-storage-indexeddb
```

## Usage

```typescript
import { getRxIdbStorage } from 'rx-storage-indexeddb'
import { createRxDatabase } from 'rxdb'

createRxDatabase<CollectionsOfDatabase>({
    name: 'mydb',
    storage: getRxIdbStorage(),
    ... more config
})

```
