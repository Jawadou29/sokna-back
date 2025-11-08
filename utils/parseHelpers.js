function parseToArray(value) {
  if (typeof value === 'string') return [value];
  return Array.isArray(value) ? value : [];
}

function parseJsonArrayField(value) {
  const result = [];
  const rawArray = parseToArray(value);

  for (const item of rawArray) {
    try {
      result.push(JSON.parse(item));
    } catch (_) {
      continue; // skip invalid
    }
  }

  return result;
}


function groupFilesByField(files) {
  return files.reduce((acc, file) => {
    if (!acc[file.fieldname]) acc[file.fieldname] = [];
    acc[file.fieldname].push(file);
    return acc;
  }, {});
}

module.exports = {
  parseToArray,
  parseJsonArrayField,
  groupFilesByField,
};