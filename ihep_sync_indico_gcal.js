**
Synchronize IHEP Indico
with GoogleCalendar.
*/

function sync_ihep_daqfee() {
  var config = {
    gcal_id : "33th9dn5m11arlsq2q7cv7kq44@group.calendar.google.com",
    //file : "indico-test.json",
    url : "https://indico.ihep.su/export/categ/30.json" +
    "?from=-7d&detail=contributions&apikey=2dbf46e3-d18e-4730-846f-2eca0cfa5fb1",
    event_filter: ihep_massage,
  };
  
  sync(config);
}


function ihep_massage(event) {
  /** Custom massaging for event data.
  */
  event.id = "ihep" + event.id;  //ID is lowercase letters a-v and digits 0-9
  desc = event.description;
  desc = desc.replace(/[\s\S]*Аннотация[:\r\n]*/, ''); //strip all before "Аннотация"
  desc = desc.replace(/\r\n/g, " ");  //remove all unnecessary newlines
  desc = desc.charAt(0).toUpperCase() + desc.slice(1);  //uppercase first character
  
  authors = event.authors;
  authors = authors.map( function(author) {
    name = author.name.replace(/^(Mr|Mrs|Dr)\. /,"");
    name = name.split(',').reverse().join(' ')  // Иванов, Иван -> Иван Иванов
    
    email = author.email;
   
    affil = author.affiliation;
    if (affil == "IHEP" ||
        affil == "Institute for High Energy Physics") {
      affil = "ИФВЭ";
    }

    return name + (affil? " (" + affil + ")":"") + (email? " " + email: ""); 
  });
  
  if (authors) {
    desc = desc.replace(/([\n].*@.*)+$/, ''); //strip the last line if contains "@"
    desc = authors.join('; ') + "\n\n" + desc; 
  }
  
  event.description = desc;
  event.authors = authors;
  //Logger.log(event);
  return event;
}
