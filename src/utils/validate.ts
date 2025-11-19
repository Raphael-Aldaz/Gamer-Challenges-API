export const validateId = (id: any): number => {
  if (!id) {
    throw new Error("Id is required")
  }
  const valide_id = parseInt(id)

  if (isNaN(valide_id)) {
    throw new Error("id must be a valid number")
  }
  return valide_id
}
