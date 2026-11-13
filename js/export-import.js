// small helpers (most implemented inline in main.js) - kept for extension
export function transactionsToCSV(items){
  const header = ['id','title','amount','type','category','date','recurring'];
  return [header.join(',')].concat(items.map(r=> [r.id, `"${r.title.replace(/"/g,'""')}"`, r.amount, r.type, r.category, r.date, r.recurring?1:0].join(',') )).join('\n');
}
export function download(filename, text){
  const blob = new Blob([text], { type:'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}