var vtodo = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BrainstormTrooper//NONSGML My quicktext//EN
BEGIN:VTODO
DTSTAMP:{{stamp}}
SEQUENCE:0
UID:{{uuid}}@brainstormtrooper.github.io
DUE:{{duedate}}
STATUS:NEEDS-ACTION
SUMMARY:{{summary}}
DESCRIPTION:{{note}} 
END:VTODO
END:VCALENDAR
`;

var vevent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BrainstormTrooper/quicktext//NONSGML v1.0//EN
BEGIN:VEVENT
UID:{{uuid}}@brainstormtrooper.github.io
DTSTAMP:{{stamp}}
DTSTART:{{startdate}}
DTEND:{{enddate}}
SUMMARY:{{summary}}
DESCRIPTION:{{note}}
END:VEVENT
END:VCALENDAR
`;

var treated = '//Quick treated:{{stamp}}';

// 19980130T134500Z
// ORGANIZER;CN=John Doe:MAILTO:john.doe@example.com