import shortid from "shortid"

export function GUID() {
    return shortid.generate();
  }
