// Data Adapter - Adapt and validate data

export function adaptData(data: any, schema: any): any {
  if (!schema) {
    return data;
  }

  if (Array.isArray(schema)) {
    return data.map((item: any) => adaptData(item, schema[0]));
  }

  if (typeof schema === 'function') {
    return schema(data);
  }

  // Handle object schemas
  if (typeof schema === 'object' && schema !== null && !Array.isArray(schema)) {
    const adapted: any = {};
    for (const key of Object.keys(schema)) {
      if (data[key] !== undefined) {
        if (typeof schema[key] === 'function') {
          adapted[key] = schema[key](data[key]);
        } else if (typeof schema[key] === 'object') {
          adapted[key] = adaptData(data[key], schema[key]);
        } else {
          adapted[key] = data[key];
        }
      }
    }
    return adapted;
  }

  return data;
}

export function validateData(data: any, schema: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schema) {
    return { valid: true, errors: [] };
  }

  if (Array.isArray(schema)) {
    for (const item of data) {
      const result = validateData(item, schema[0]);
      if (!result.valid) {
        errors.push(...result.errors);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  // Handle object schemas
  if (typeof schema === 'object' && schema !== null && !Array.isArray(schema)) {
    for (const key of Object.keys(schema)) {
      if (data[key] === undefined) {
        errors.push(`Missing required field: ${key}`);
        continue;
      }

      if (typeof schema[key] === 'function') {
        if (!schema[key](data[key])) {
          errors.push(`Invalid value for field: ${key}`);
        }
      } else if (typeof schema[key] === 'object') {
        const result = validateData(data[key], schema[key]);
        if (!result.valid) {
          errors.push(...result.errors.map((err) => `${key}.${err}`));
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
