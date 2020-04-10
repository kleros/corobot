import * as Ajv from 'ajv'
import { Request, Response } from 'express'
import * as jsonSchemaDraft from 'ajv/lib/refs/json-schema-draft-06.json'
import * as disarmSchema from './disarm.json'


const ajv = Ajv({ allErrors: true, removeAdditional: 'all' })
ajv.addMetaSchema(jsonSchemaDraft)
ajv.addSchema(disarmSchema, 'disarm')

/**
 * Format error responses
 * @param  {object} schemaErrors - array of json-schema errors, describing each validation failure
 * @returns {string} formatted api response
 */
function errorResponse(schemaErrors: Ajv.ErrorObject[]) {
  const errors = schemaErrors.map((error: Ajv.ErrorObject) => ({
    path: error.dataPath,
    message: error.message
  }))
  return {
    status: 'failed',
    errors: errors
  }
}

/**
 * Validates incoming request bodies against the given schema,
 * providing an error response when validation fails
 * @param  {string} schemaName - name of the schema to validate
 * @returns {object} response
 */
export default function validateSchema(schemaName: string) {
  return (req: Request, res: Response, next: any) => {
    if (!ajv.validate(schemaName, req.body))
      return res.send(errorResponse(ajv.errors as Ajv.ErrorObject[]))

    return next()
  }
}
