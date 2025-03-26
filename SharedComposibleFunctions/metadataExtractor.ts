// src/utils/metadataExtractor.ts
export function extractMetadataFromQuery(cypherQuery: string) {
    let cleanQuery = cypherQuery
      .replace(/(RETURN|return)(?:.)*/gm, '')
      .replace(/(ORDER|order)(?:.|\n)*/gm, '')
      .replace(/(WHERE|where)(?:.|n)*/gm, '')
      .replace(/\[(?:.)*?:/gm, '[:')
      .replace(/\*(?!\d)/gm, '')
  
    // Extract potential metadata relationship variables
    const relationshipVars = cleanQuery.match(/\[(\w+):/g) || []
    
    const metadataQuery = `
      WITH * 
      ${relationshipVars.map((v, i) => `
        WITH *, CASE WHEN ${v.replace('[', '')} IS :: LIST<RELATIONSHIP> 
        THEN ${v.replace('[', '')} ELSE [${v.replace('[', '')}] END AS var${i}
      `).join('\n')}
      UNWIND (
        ${relationshipVars.map((v, i) => `
          [r IN var${i} WHERE r.reference_org IS NOT NULL | 
            {
              org: r.reference_org, 
              url_data: r.reference_url_data, 
              url_info: r.reference_url_info,
              fetch_time: r.reference_time_fetch,
              mod_time: r.reference_time_modification
            }
          ]
        `).join(' + ')
      }) AS metadata
      RETURN DISTINCT metadata
    `
  
    return metadataQuery
  }