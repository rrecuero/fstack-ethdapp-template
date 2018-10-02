import { toOlyDateUtc } from './dateutils';
import { MIN_SUPPORT } from '../storage/eswrapper';

export function getTagMatch(topics) {
  return {
    nested: {
      path: 'tags',
      query: {
        function_score: {
          query: {
            bool: {
              should: [
                { terms: { 'tags.name': topics } },
              ],
              filter: [
                { range: { 'tags.support': { gt: MIN_SUPPORT } } }
              ]
            }
          },
          functions: [
            {
              field_value_factor: {
                factor: 3,
                field: 'tags.support',
                modifier: 'ln'
              }
            }
          ]
        },
      }
    }
  };
}

function getMultiMatchQuery(query, extraBody) {
  const fields = [
    'title^5',
    'tags.name^5',
    'page^3',
    'summary^2'
  ];
  return {
    multi_match: Object.assign({
      query,
      type: 'best_fields',
      tie_breaker: 0.5,
      fuzziness: 1,
      prefix_length: Math.max(3, Math.max(query.length - 2, 0)),
      max_expansions: 20,
      minimum_should_match: '75%',
      operator: 'and',
      fields
    }, extraBody)
  };
}

export function getFieldsMatch(query, extraBody) {
  const multiMatch = getMultiMatchQuery(query, extraBody);
  return multiMatch;
}

function getListBoolSources(filters) {
  const listBool = [];
  if (filters.source.indexOf('hn') !== -1) {
    listBool.push({
      range: {
        hnScore: {
          gte: 1
        }
      }
    });
  }
  if (filters.source.indexOf('producthunt') !== -1) {
    listBool.push({
      range: {
        phScore: {
          gte: 1
        }
      }
    });
  }
  return listBool;
}

export function getFiltersQuery(filters, type = 'es') {
  const esFilter = [];
  const mongoFilter = {};

  if (!filters) {
    return (type === 'es') ? esFilter : mongoFilter;
  }

  if (filters.date) {
    let dateString = '';
    switch (filters.date) {
      case 'hour':
        dateString = toOlyDateUtc(null, { hour: 1 });
        break;
      case '6hour':
        dateString = toOlyDateUtc(null, { hour: 6 });
        break;
      case '47hour':
        dateString = toOlyDateUtc(null, { hour: 47 });
        break;
      case 'day':
        dateString = toOlyDateUtc(null, { day: 1 });
        break;
      case '3day':
        dateString = toOlyDateUtc(null, { day: 3 });
        break;
      case '2day':
        dateString = toOlyDateUtc(null, { day: 2 });
        break;
      case 'week':
        dateString = toOlyDateUtc(null, { week: 1 });
        break;
      case 'month':
        dateString = toOlyDateUtc(null, { month: 1 });
        break;
      case 'year':
        dateString = toOlyDateUtc(null, { year: 1 });
        break;
      default:
        dateString = toOlyDateUtc(null, { year: 5 });
    }

    if (type === 'es') {
      esFilter.push({
        range: {
          entryDate: {
            gte: dateString,
            lt: toOlyDateUtc(),
          }
        }
      });
    } else if (type === 'mongo') {
      mongoFilter.entryDate = {
        $gte: dateString,
        $lt: toOlyDateUtc(),
      };
    }
  }

  // Both Filters and domain
  if (filters.source && filters.source !== 'any' &&
      filters.domain && filters.domain !== 'any') {
    if (type === 'es') {
      const listBool = [
        { terms: { domain: filters.domain } }
      ];
      const listSources = getListBoolSources(filters);
      esFilter.push({
        bool: {
          should: listBool.concat(listSources),
          minimum_should_match: 1
        }
      });
    } else {
      mongoFilter.domain = { domain: { $in: filters.domain } };
    }
  } else {
    if (filters.source && filters.source !== 'any') {
      if (type === 'es') {
        const listSources = getListBoolSources(filters);
        esFilter.push({
          bool: {
            should: listSources,
            minimum_should_match: 1
          }
        });
      }
    }
    if (filters.domain && filters.domain !== 'any') {
      if (type === 'es') {
        esFilter.push({
          terms: { domain: filters.domain }
        });
      } else if (type === 'mongo') {
        mongoFilter.domain = { domain: { $in: filters.domain } };
      }
    }
  }

  if (filters.sentiment && filters.sentiment !== 'any') {
    const sentiments = {
      negative: { min: -1, max: 0 },
      neutral: { min: 0, max: 1 },
      positive: { min: 1, max: 2 }
    };
    const { min, max } = sentiments[filters.sentiment];
    if (type === 'es') {
      if (filters.sentiment !== 'negative') {
        esFilter.push({
          range: {
            sentiment: {
              gte: min,
              lt: max,
            }
          }
        });
      } else {
        esFilter.push({
          term: {
            sentiment: -0
          }
        });
      }
    } else if (type === 'mongo') {
      mongoFilter.sentiment = {
        $gte: min,
        $lt: max,
      };
    }
  }
  return (type === 'es') ? esFilter : mongoFilter;
}
