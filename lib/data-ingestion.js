"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestCrimeData = ingestCrimeData;
exports.aggregateMonthlyData = aggregateMonthlyData;
var db_1 = require("./db");
var sync_1 = require("csv-parse/sync");
var fs = require("fs");
// City coordinates mapping (expand as needed)
var CITY_COORDINATES = {
    MANGALORE: { lat: 12.9141, lon: 74.856 },
    BANGALORE: { lat: 12.9716, lon: 77.5946 },
    MYSORE: { lat: 12.2958, lon: 76.6394 },
    UDUPI: { lat: 13.3409, lon: 74.7421 },
    KARWAR: { lat: 14.8137, lon: 74.129 },
    // Add more cities as needed
};
function parseDate(dateStr) {
    try {
        // Handle various date formats
        var cleaned = dateStr.trim();
        if (!cleaned)
            return null;
        // Try ISO format first
        var date = new Date(cleaned);
        if (!isNaN(date.getTime()))
            return date;
        // Try DD/MM/YYYY format
        var parts = cleaned.split("/");
        if (parts.length === 3) {
            var day = parts[0], month = parts[1], year = parts[2];
            return new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day));
        }
        return null;
    }
    catch (_a) {
        return null;
    }
}
function getCityCoordinates(city) {
    var normalized = city.toUpperCase().trim();
    return CITY_COORDINATES[normalized] || { lat: 0, lon: 0 };
}
function generateLocationId(city, lat, lon) {
    // Create location ID based on city and rounded coordinates
    var latRounded = Math.round(lat * 100) / 100;
    var lonRounded = Math.round(lon * 100) / 100;
    return "".concat(city.toLowerCase().replace(/\s+/g, "_"), "_").concat(latRounded, "_").concat(lonRounded);
}
function ingestCrimeData(csvPath) {
    return __awaiter(this, void 0, void 0, function () {
        var fileContent, records, successCount, errorCount, locationStatsMap, _i, records_1, row, dateOccurrence, dateReported, year, month, day, weekday, city, coords, locationId, victimAge, victimGender, error_1, _a, _b, stats;
        var _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    console.log("Starting data ingestion...");
                    fileContent = fs.readFileSync(csvPath, "utf-8");
                    records = (0, sync_1.parse)(fileContent, {
                        columns: true,
                        skip_empty_lines: true,
                        trim: true,
                    });
                    console.log("Parsed ".concat(records.length, " records from CSV"));
                    successCount = 0;
                    errorCount = 0;
                    locationStatsMap = new Map();
                    _i = 0, records_1 = records;
                    _e.label = 1;
                case 1:
                    if (!(_i < records_1.length)) return [3 /*break*/, 6];
                    row = records_1[_i];
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, 4, , 5]);
                    dateOccurrence = parseDate(row["DATE OFOCCURENCE"]);
                    dateReported = parseDate(row["DATE REPORTED"]);
                    if (!dateOccurrence) {
                        errorCount++;
                        return [3 /*break*/, 5];
                    }
                    year = dateOccurrence.getFullYear();
                    month = dateOccurrence.getMonth() + 1;
                    day = dateOccurrence.getDate();
                    weekday = dateOccurrence.getDay();
                    city = ((_c = row["CITY"]) === null || _c === void 0 ? void 0 : _c.trim()) || "UNKNOWN";
                    coords = getCityCoordinates(city);
                    locationId = generateLocationId(city, coords.lat, coords.lon);
                    victimAge = Number.parseInt(row["VICTIM AGE"]) || null;
                    victimGender = ((_d = row["VICTIM GEDER"]) === null || _d === void 0 ? void 0 : _d.trim().toUpperCase()) || null;
                    // Create crime record
                    return [4 /*yield*/, db_1.prisma.crimeRecord.create({
                            data: {
                                reportNo: row["REPORT NO"],
                                dateReported: dateReported || dateOccurrence,
                                dateOfOccurrence: dateOccurrence,
                                year: year,
                                month: month,
                                day: day,
                                weekday: weekday,
                                city: city,
                                crimeCode: row["CRIME CODE"],
                                crimeDescription: row["CRIME DESCRIPTION"],
                                victimAge: victimAge,
                                victimGender: victimGender,
                                latitude: coords.lat,
                                longitude: coords.lon,
                                locationId: locationId,
                                severity: 1, // Default severity
                            },
                        })
                        // Track location stats
                    ];
                case 3:
                    // Create crime record
                    _e.sent();
                    // Track location stats
                    if (!locationStatsMap.has(locationId)) {
                        locationStatsMap.set(locationId, {
                            locationId: locationId,
                            locationName: city,
                            city: city,
                            latitude: coords.lat,
                            longitude: coords.lon,
                            totalCrimes: 0,
                        });
                    }
                    locationStatsMap.get(locationId).totalCrimes++;
                    successCount++;
                    if (successCount % 100 === 0) {
                        console.log("Processed ".concat(successCount, " records..."));
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _e.sent();
                    console.error("Error processing row:", error_1);
                    errorCount++;
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    // Upsert location stats
                    console.log("Updating location statistics...");
                    _a = 0, _b = locationStatsMap.values();
                    _e.label = 7;
                case 7:
                    if (!(_a < _b.length)) return [3 /*break*/, 10];
                    stats = _b[_a];
                    return [4 /*yield*/, db_1.prisma.locationStats.upsert({
                            where: { locationId: stats.locationId },
                            update: { totalCrimes: stats.totalCrimes },
                            create: stats,
                        })];
                case 8:
                    _e.sent();
                    _e.label = 9;
                case 9:
                    _a++;
                    return [3 /*break*/, 7];
                case 10:
                    console.log("Ingestion complete: ".concat(successCount, " success, ").concat(errorCount, " errors"));
                    return [2 /*return*/, { successCount: successCount, errorCount: errorCount }];
            }
        });
    });
}
function aggregateMonthlyData() {
    return __awaiter(this, void 0, void 0, function () {
        var aggregations, _i, aggregations_1, agg, locationStats, crimeCount, crimeRate, zoneClassification;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Starting monthly aggregation...");
                    return [4 /*yield*/, db_1.prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    SELECT \n      location_id,\n      year,\n      month,\n      COUNT(*) as crime_count,\n      SUM(CASE WHEN victim_gender = 'M' THEN 1 ELSE 0 END) as male_victims,\n      SUM(CASE WHEN victim_gender = 'F' THEN 1 ELSE 0 END) as female_victims,\n      AVG(victim_age) as avg_victim_age\n    FROM crime_records\n    WHERE location_id IS NOT NULL\n    GROUP BY location_id, year, month\n    ORDER BY location_id, year, month\n  "], ["\n    SELECT \n      location_id,\n      year,\n      month,\n      COUNT(*) as crime_count,\n      SUM(CASE WHEN victim_gender = 'M' THEN 1 ELSE 0 END) as male_victims,\n      SUM(CASE WHEN victim_gender = 'F' THEN 1 ELSE 0 END) as female_victims,\n      AVG(victim_age) as avg_victim_age\n    FROM crime_records\n    WHERE location_id IS NOT NULL\n    GROUP BY location_id, year, month\n    ORDER BY location_id, year, month\n  "])))];
                case 1:
                    aggregations = _a.sent();
                    console.log("Found ".concat(aggregations.length, " monthly aggregations"));
                    _i = 0, aggregations_1 = aggregations;
                    _a.label = 2;
                case 2:
                    if (!(_i < aggregations_1.length)) return [3 /*break*/, 6];
                    agg = aggregations_1[_i];
                    return [4 /*yield*/, db_1.prisma.locationStats.findUnique({
                            where: { locationId: agg.location_id },
                        })];
                case 3:
                    locationStats = _a.sent();
                    crimeCount = Number(agg.crime_count);
                    crimeRate = (locationStats === null || locationStats === void 0 ? void 0 : locationStats.population) ? (crimeCount / locationStats.population) * 1000 : null;
                    zoneClassification = "green";
                    if (crimeCount > 50)
                        zoneClassification = "red";
                    else if (crimeCount > 20)
                        zoneClassification = "amber";
                    return [4 /*yield*/, db_1.prisma.monthlyAggregation.upsert({
                            where: {
                                locationId_year_month: {
                                    locationId: agg.location_id,
                                    year: agg.year,
                                    month: agg.month,
                                },
                            },
                            update: {
                                crimeCount: crimeCount,
                                crimeRate: crimeRate,
                                zoneClassification: zoneClassification,
                                maleVictims: Number(agg.male_victims),
                                femaleVictims: Number(agg.female_victims),
                                avgVictimAge: agg.avg_victim_age,
                            },
                            create: {
                                locationId: agg.location_id,
                                year: agg.year,
                                month: agg.month,
                                crimeCount: crimeCount,
                                crimeRate: crimeRate,
                                zoneClassification: zoneClassification,
                                maleVictims: Number(agg.male_victims),
                                femaleVictims: Number(agg.female_victims),
                                avgVictimAge: agg.avg_victim_age,
                            },
                        })];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6:
                    console.log("Monthly aggregation complete");
                    return [2 /*return*/];
            }
        });
    });
}
var templateObject_1;
