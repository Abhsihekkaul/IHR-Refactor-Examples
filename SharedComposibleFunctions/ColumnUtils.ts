// src/utils/columnUtils.ts
export interface ColumnConfig {
    name: string
    label: string
    field: string | ((row: any) => any)
    format?: (val: any, row?: any) => string
    sortable?: boolean
    align?: 'left' | 'right' | 'center'
    description?: string
  }
  
  export function createColumn({
    name, 
    label, 
    field, 
    format = (val) => val, 
    sortable = true, 
    align = 'left',
    description = ''
  }: ColumnConfig) {
    return {
      name,
      label,
      align,
      field: typeof field === 'string' 
        ? row => row[field] 
        : field,
      format,
      sortable,
      description
    }
  }
  
  // Predefined format helpers
  export const formatters = {
    uppercase: (val) => String(val).toUpperCase(),
    percentage: (val) => `${Number(val).toFixed(2)}%`,
    asNumber: (val) => `AS${val}`,
    list: (val) => Array.isArray(val) ? val.join(', ') : val
  }