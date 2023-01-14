#!/usr/bin/env python

import APIKEYS
import requests
import operator
import json
from datetime import datetime 
from pytz import timezone
from pprint import pprint

from collections import namedtuple


indico_url = "https://{site}/export/categ/{category}.json?from=-7d&apikey={apikey}&detail=contributions"

request_data = {
    'apikey': APIKEYS.INDICO_APIKEY,
    'site': 'indico.ihep.su/indico',
    'category': 30,
    }
request_url = indico_url.format(**request_data)
print "request:", request_url


Event = namedtuple('Event', ['url', 'title', 'speaker', 'description', 'starts', 'ends'])

def str_event(e):
    val = '\n'.join([e.title, e.speaker, e.url, e.description, str(e.starts), str(e.ends)])
    return val

#r = requests.get(request_url)
#resp_json = r.json()


r = open('30.json','r').read()
resp_json = json.loads(r)

events = {}

try:
    for res in resp_json['results']:
        main = max(res['contributions'], key=lambda x: x['duration'])

        res_id = int(res['id'])
        
        res_date = datetime.strptime(res['startDate']['date'], '%Y-%m-%d')

        res_time_start = datetime.strptime(res['startDate']['time'], '%H:%M:%S')
        res_time_start = res_time_start.replace(tzinfo=timezone(res['startDate']['tz']))

        res_time_end = datetime.strptime(res['endDate']['time'], '%H:%M:%S')
        res_time_end = res_time_end.replace(tzinfo=timezone(res['endDate']['tz']))

        events[res_id] = Event(
                url = res['url'],
                title = main['title'],
                speaker = main['speakers'][0]['fullName'].replace('Mr. ','') ,
                description = main['description'],
                starts = datetime.combine(res_date, res_time_start.timetz()),
                ends =  datetime.combine(res_date, res_time_end.timetz()),
                )

except KeyError as e:
    raise

for k, v in sorted(events.iteritems()):
    print k
    print str_event(v)
