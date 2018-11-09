import shortid from 'shortid'
shortid.characters(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-'
)
export function GUID() {
  return 'c' + shortid.generate()
}
