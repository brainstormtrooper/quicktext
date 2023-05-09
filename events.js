var vtodo = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BrainstormTrooper//NONSGML My quicktext//EN
BEGIN:VTODO
DTSTAMP:{{stamp}}
SEQUENCE:2
UID:{{uuid}}@brainstormtrooper.github.io
DUE:{{duedate}}
STATUS:NEEDS-ACTION
SUMMARY:{{note}}
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
SUMMARY:{{note}}
END:VEVENT
END:VCALENDAR
`;

// 19980130T134500Z
// ORGANIZER;CN=John Doe:MAILTO:john.doe@example.com