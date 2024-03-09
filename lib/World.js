const crc32 = require("crc-32");
const DataStream = require("./DataStream");
const Tiles = require("./Tiles");
const Tile = require("./Tile");
class World {
    tiles;
    constructor() {
        this.tiles = new Tiles(0, 0)
    }
    create(x, y, f, o, w) {
        this.tiles.set(x, y, new Tile(x, y, f, o, w))
    }
    resize(w, h) {
        if (this.tiles.width != w || this.tiles.height != h) {
            this.tiles = new Tiles(w, h)
        }
        return this.tiles
    }
    toPNG() {
        const colors = [255, -1456134145, 2139062271, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 1028227327, 1196724223, 1245278975, 891900927, 959597311, 1953004287, 892817919, 370677759, 1419621887, -1000131841, 83890943, 255, 1111640063, 1128482815, 1010582271, 825176063, 1127756287, 1749693951, -1484165121, 808333055, 1328622335, 689444351, 2021230335, 1530474239, 1496788223, 1362242559, 1917531903, 1951217407, 572926975, 942813695, 1010119679, 691022847, 757542911, 976176127, -2124596993, -1958919681, -1840823041, -1045518081, 1433418751, 944321279, 1109597951, 387522559, 674638335, 1547183871, 1814968319, 521937663, 1160456959, 757547263, 1417955839, -1128415233, -1279804417, -1566391553, -1667318785, 1246127615, 1446403327, 1801145343, 1446537471, 2054848511, -1957259777, 1883652351, -1600014081, -741212161, -268959745, 1515805183, -895853825, -1536210689, 1967471103, 1145852415, 1835228415, 1314738431, 1736726271, 1784310271, -69409793, -1152165377, -478058753, -2114305, -185008129, 1891330047, 1920246015, -1840343809, -285736961, 1520393471, -504693505, -690226689, -994903297, -579907841, 1549313279, -427669249, 2088534527, -268959745, 2004527615, -2246145, -1448427777, 1532648191, 1196381439, 1902534655, 1365332991, -1603516929, 1702974975, -2073197825, -1182878721, -811508993, 2090623743, 1733715711, -19078657, -1771811841, -1135257089, 1431789823, 1398038271, 1347508991, 1515939327, 1566534399, 1817726207, 1010714623, 1094600191, 993805823, 1128615935, 1178815487, 1313164543, 2122354687, 1212632063, 1379162623, -643992577, -1937790465, 2004318207, 656877567, -1918770177, -106706945, 982476031, 1988795135, -106706945, -106706945, 982476031, 1348103167, 1988795135, -1818779137, -1902994433, -1987275521, -1970432513, -1550148353, -1363760385, -961503745, -1264150273, -1683899649, -1163024129, -1163417601, -1147562497, -1331912705, -1264935937, -1701071873, -2105175553, -1313167361, -1922011393, 1936618495, 1938063103, -2121686017, 1904639743, -2004908033, -1803780353, -1802925825, -2004908033, -2055304961, -1601928193, -1602257665, -1770226433, -1887076097, -2054379777, -1618181889, -2005171457, -962887169, -946109953, 2140139007, 2123361535, -487483393, -605318913, -1904101889, -1904101889, -1984769, -2379777, -35815681, -35881217, -1616200961, -1666926849, -1515207681, -1447769857, -1481456129, -1481390337, -1616331521, 1722252031, 1587180287, -2105241089, 2105511167, 2038663679, -1538561, -1932289, -1534413313, -1669025537, -2379521, -1783191041, -1766413825, -1214144001, -1163944193, -1331058433, 1499162111, -1853588225, -2106166017, -2138595841, -1803450881, -1819768833, -1836546049, 1869708543, 1735299839, 1954179583, 1751417855, -2122083841, 2088602367, -1129602305, 1852865791, 2004056831, 2021296383, 2105511167, 1886551807, 2037743103, -1617059329, 1970700799, -2037473281, -2122084609, 2105511167, -2054910721, 1937015295, -1936811521, -1938330369, -1163749889, -1567784193, -1752463361, -1533173249, -1801664769, -1885745153, -1734498817, -1952988673, -1970952193, -1768249345, -1717517313, -1767980033, -1380663553, -1515538945, -1818442241, 2106032895, -2052356609, -1918594561, 1921874431, 1938127871, 1904705279, 1954709759, -994336513, -926965249, -776366081, -1583374593, -927490049, -978149889, -1113025281, -1113612545, -1213291265, -1045192705, -2055298561, -1936547329, -2138859777, -2105632001, -1315464705, 1989181183, 1954972671, 1938653439, -1870822913, 1820227839, 1736143615, -1903853057, -1803582465, -1618048769, -1768184065, -1718045953, -1432838913, -1852263681, -1835817217, -1549098241, 1854175999, -1803188993, -1383168513, -1618509057, -1820359937, -2138661377, -944330753, -843734785, -776626689, -1517123585, -1281849601, -1365866753, -1196446465, -1145983745, -1432115969, -1617983489, -1701999617, -1870494977, -2037870081, -1886480897, -1769239297, -1701536257, -1767915265, -1785090561, -1481851649, -1971948033, -1684692737, -1398164993, -2088198913, 2088934399, -1937537281, -1852929281, -1987673345, -1920826113, -2021818369, 1701999615, 2003596031, 1986887935, 2003727615, 1953989887, 2037806847, 1920303871, 2138076415, -2106099969, -2139911937, -1853255425, -2104257537, -2121818113, -1987539201, -2004315905, -1987538945, -1970894081, 2106428927, -2036689153, 2003464191, 1802075903, 1836090111, 1953000703, 1785626367, 1768324095, 1987014911, -2123006977, 1987283455, 2004585727, 2087676671, 1921614335, 1836088063, 1987675647, 1734964735, 1600219903, 2071098623, -2089190401, 2070902015, -2123600385, 1986949631, 1970106623, 1532586751, 1683972351, -994926337, -1365538305, -1870761473, -1854049537, -1247438849, -1146512129, -1937604609, -1887403009, -1836611329, -1380794881, 255, 255, 255, 255, 255, -1247371265, -1331058177, -2071750913, 2071564543, -1600731649, -1600470785, -1600731905, -2072142337, -2072338689, 1903265535, 1751677951, 1548899839, -1970894081, -911303425, -1802927361, -1970697473];
        const teams = [1296980223, -2916353, -229288449, -1568872961, 1423343103, 1820851711, -347033345, 446977279, 353869567, 829939455, 1617156607, -1084487169, 1746445311, 985027071, 397182207, -710715393, -1532668161, 1386739455, -1587406593, -1435102465, -84384001, -1097708545, 1182441727, 86561023, -1316870913, 1355844095, 1005811455, -1868815617, 373217279, -1604664577, 1894837247, 1001088511, 380587519, -126684417, -965359361, -1304712193, -1166482433, -482507009, -1792153601, 1623725567, -1372405249, 1421641983, -69970177, 1119012607, 1330041343, -212356097, -736757249, 1495527935, -987017985, -1268003585, 2060247807, 972363007, 1150145023, -944874241, -780283137, 968744703, 508415999, 1239662847, 604817407, 1349428735, 580915711, -42289409, 1169989119, 660644863, 1507383039, -2050281217, -602237697, 781559551, 1240720127, 1691396351, 374187263, -1295705089, 306627583, -1732898561, 1961660415, -1435871489, 1237649151, -2030717185, 380015359, 1472188671, -552705025, -422482945, -1475773185, -1708018945, -230606593, 1503558143, 1452715519, -1204584449, 1773591295, 114446335, -70501377, -2031122177, -1951508993, 1502718975, 77497087, -1688894465, -883251713, -290692353, 599593215, -907256577, 1476110079, -464658945, -1387707393, 497452543, -131982849, -1139828993, 1341820415, 9297151, 784202239, -1309860865, -782141953, 1739340799, 497646847, -686005761, 1489870847, -1017213441, -1870074881, -1189611265, 2143758591, 1720299007, 2043785215, 125677055, -1304993025, 1522961151, -52821249, 1418129151, -1455196929, 2099816191, -1405666305, -1655471617, -538169601, -1049234177, 1315091711, -920625409, -1622160897, 1405187839, 1590290431, 1423529215, -1166908161, -1051679489, 113321471, 1309401599, -475390721, 25535743, 678664703, -1477498625, -20230657, -2057656577, -1618268929, -40099329, 1297850367, -1487318273, 1520677375, -1624124161, 385997823, -668451329, -177338369, -1454144769, -357234945, 755149311, -1202475521, 50131967, 1121050111, -396030721, -591325953, 716175103, 1844492031, 447067391, -1471524609, 1960780287, 1855806207, -418102785, 422699007, -828869889, 1555123967, -1642516481, 1252290047, -247797761, 219139839, 542035455, -870765313, 2063384319, 266052863, 431062783, -1051131393, -502697473, -1576932353, 710909695, -1109845505, 967483135, 1754645759, 1317462783, 750565887, -1252004353, 1605503487, 414669055, 1484170751, 1055032319, 917520639, -1699995649, 611755775, -2085146625, 1251972863, -464758273, -1459183617, -1531032577, 1506640383, -1206914817, 1675728639, 1674982399, -1614384385, -327748353, -829339137, -187298049, 2042517759, 736751359, -2135397633, 1388621823, 534313727, -2005863937, -88307201, -1696626945, 1884548351, 975088383, 354411775, -1728898305, -1866663425, 1593878783, -1394802433, -529779457, -665080833, 1305473535, 1997993215, -1192230657, 2124744959, -729216513, -1420324353, -328079361, -349541377, 968279295, -920238849, 1454809343, -358577153, 666977023, 991550463, -1591572993, -147083009, -1505987329, -402493697, -1177864193, -1313075457, -1644532993, -43396865, 1459057407, -1350355713, 383010047];
        //TODO blockcolors
        let tiles = this.tiles;
        let width = tiles.width, height = tiles.height;
        let output = DataStream.allocate(width * height * 5 + 30);
        let temp = DataStream.allocate(width * height * 5 + 30);
        let flush = () => {
            let buf = Buffer.alloc(4);
            buf.writeInt32BE(temp.position() - 4);
            output.put(buf);
            temp.flip();
            output.put(temp._getBuffer());
            buf.writeInt32BE(crc32.buf(temp._getBuffer()));
            output.put(buf);
            temp.clear()
        };
        output.put([137, 80, 78, 71, 13, 10, 26, 10]);
        temp.put("IHDR");
        temp.putInt(width);
        temp.putInt(height);
        temp.put([8, 6, 0, 0, 0]);
        flush();
        temp.put("IDAT");
        let pos = temp.position();
        for (let y = height - 1; y >= 0; y--) {
            temp.put(0);
            for (let x = 0; x < width; x++) {
                let pos = y * width + x;
                let tile = tiles.array[pos];
                let color = colors[tile.overlay || tile.floor];
                temp.put(color >> 24 & 0xff);
                temp.put(color >> 16 & 0xff);
                temp.put(color >> 8 & 0xff);
                temp.put(color & 0xff)
            }
        }
        temp.flip();
        let zipped = zlib.deflateSync(temp._getBuffer(pos));
        temp.limit(temp.capacity());
        temp.position(pos);
        temp.put(zipped);
        flush();
        temp.put("IEND");
        flush();
        output.flip();
        return output._getBuffer()
    }
}


module.exports = World