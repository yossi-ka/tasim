import data from './data.json';

export default class Terms {

  constructor(terms) {
    this.terms = data[terms] ? data[terms] : data["General"];
  }

  getTerms() {
    return this.terms;
  }

  getLabel(name) {
    const term = this.terms.find(term => term.name === name);
    return term ? term.label : '';
  }

  getTermByName(name) {
    const term = this.terms.find(term => term.name === name);
    return term;
  }

  getTermsByName(names) {
    const terms = this.terms.filter(term => names.includes(term.name));
    return terms;
  }

  getTermsForTable(names = null, replace = null) {
    const columns = [];
    const terms = names ? this.getTermsByName(names) : this.terms;
    terms.forEach(term => {
      if (replace && replace[term.name]) {
        columns.push({
          label: term.label,
          ...replace[term.name]
        });
      } else {
        columns.push({
          key: term.name,
          label: term.label
        })
      }
    });
    return columns;
  }

  table(names = null, replace = null) {
    const columns = [];
    const _terms = names ? this.getTermsByName(names) : this.terms;
    _terms.forEach(term => {
      if (replace && replace[term.name]) {
        columns.push({
          label: term.label,
          ...replace[term.name]
        });
      } else {
        columns.push({
          key: term.name,
          label: term.label,
          type: term.type,
          lookup: term.lookup ? term.lookup : null
        })
      }
    });
    return columns;
  }

  excel(names = null, replace = null) {
    const columns = [];
    const _terms = names ? this.getTermsByName(names) : this.terms;
    _terms.forEach(term => {
      if (replace && replace[term.name]) {
        columns.push({
          // label: term.label,
          ...replace[term.name],
          ...term
        });
      } else {
        columns.push({
          // label: term.label,
          ...term
        });
      }
    });
    return columns;
  }

  field(name, obj = {}) {
    const _term = this.getTermByName(name);
    if (!_term) return obj;
    return { ..._term, ...obj };
  }

  getFakeDataForTable = (names = null, arraySize = 50) => {
    const data = [];
    const terms = names ? this.getTermsByName(names) : this.terms;
    for (let index = 0; index < arraySize; index++) {
      const row = {};
      terms.forEach(term => row[term.name] = term.label + ' ' + index);
      data.push(row);
    }
    return data;
  }

  getTermForForm(name, obj = {}) {
    const term = this.getTermByName(name);
    if (!term) return obj;
    return { ...term, ...obj };
  }

}

// export const getTermsByName = (names) => {
//     let terms = [];
//     names.forEach(name => {
//         terms.push(getTermByName(name));
//     });
//     return terms;
// }

// export const getTermsForTable = (names) => {
//     const columns = [];
//     const terms = getTermsByName(names);
//     terms.forEach(term => columns.push({key: term.name, label: term.label}));
//     return columns;
// }

// export const getFakeDataForTable = (names, arraySize = 50) => {
//     const data = [];
//     const terms = getTermsByName(names);
//     for (let index = 0; index < arraySize; index++) {
//         const row = {};
//         terms.forEach(term => row[term.name] = term.label + ' ' + index);
//         data.push(row);
//     }
//     return data;
// }