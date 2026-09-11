/** Run inside the backend container. Defaults to read-only validation; pass --apply to insert. */
const { createHash } = require("node:crypto");
const mongoose = require("/app/node_modules/mongoose");
const { MongoClient } = mongoose.mongo;
const SEED = "scenarios-2026-09-v1";
const seedId = (key) =>
  new mongoose.Types.ObjectId(
    createHash("sha256").update(`${SEED}:${key}`).digest("hex").slice(0, 24),
  );
const schemaModules = {
  User: "users/schemas/user.schema",
  Club: "clubs/schemas/club.schema",
  ClubMembership: "clubs/schemas/club-membership.schema",
  Court: "reservations/schemas/court.schema",
  ReservableSession: "reservations/schemas/reservable-session.schema",
  Reservation: "reservations/schemas/reservation.schema",
  BenefitProduct: "commerce/schemas/entitlement.schema",
  ClubReview: "reviews/schemas/club-review.schema",
  Article: "articles/schemas/article.schema",
  ClubBranch: "business-operations/schemas/branch.schema",
  ClubCoachProfile: "business-operations/schemas/coach.schema",
  ClubStudent: "business-operations/schemas/student.schema",
};
for (const name of [
  "Coach",
  "CoachSport",
  "CoachOffering",
  "TrainingClass",
  "TrainingSession",
  "ClassEnrollment",
  "SessionBooking",
  "CoachAvailabilityRule",
])
  schemaModules[name] = "coaching/schemas/coaching.schemas";
for (const name of [
  "BusinessTrainingClass",
  "BusinessClassSession",
  "BusinessClassEnrollment",
])
  schemaModules[name] = "business-operations/schemas/training-class.schema";
const models = Object.fromEntries(
  Object.entries(schemaModules).map(([name, path]) => {
    const schema = require(`/app/dist/modules/${path}.js`)[`${name}Schema`];
    if (!schema) throw Error(`Missing deployed schema ${name}`);
    return [
      name,
      mongoose.model(`Scenario${name}`, schema, schema.options.collection),
    ];
  }),
);
const docs = [];
let anchor;
const at = (days, hour = 9) => {
  const d = new Date(anchor);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
};
function add(model, key, fields) {
  const value = new models[model]({
    _id: seedId(key),
    ...fields,
    createdAt: anchor,
    updatedAt: anchor,
  });
  const error = value.validateSync();
  if (error) throw Error(`${key}: ${error.message}`);
  const doc = {
    ...value.toObject({ flattenMaps: true }),
    seedBatch: SEED,
    seedKey: key,
  };
  docs.push({ collection: models[model].collection.name, doc });
  return doc;
}
const note =
  "داده سناریویی برای بررسی قابلیت‌های سامانه؛ مجموعه یا شخص واقعی نیست.";
const openDay = (date) => {
  if (date.getUTCDay() === 5) date.setUTCDate(date.getUTCDate() + 1);
  return date;
};
const title = (s) => `سناریو | ${s}`;
const policy = {
  title: "لغو انعطاف‌پذیر سناریویی",
  tiers: [
    { hoursBefore: 24, refundPercent: 100 },
    { hoursBefore: 6, refundPercent: 50 },
    { hoursBefore: 0, refundPercent: 0 },
  ],
  reservationCutoffMinutes: 30,
  rescheduleCutoffMinutes: 120,
};
async function main() {
  const client = new MongoClient(process.env.MONGODB_URL);
  await client.connect();
  try {
    const db = client.db();
    if (db.databaseName !== "gym4me") throw Error("Expected gym4me database");
    const oldRun = await db
      .collection("scenario_seed_runs")
      .findOne({ _id: SEED });
    anchor = oldRun?.anchor ?? new Date();
    const refs = {};
    for (const name of [
      "countries",
      "cities",
      "provinces",
      "districts",
      "city_regions",
      "club_types",
      "sports",
      "amenities",
      "equipment",
      "skill_levels",
      "article_categories",
    ])
      refs[name] = await db.collection(name).find({ isActive: true }).toArray();
    const ref = (collection, code) => {
      const r = refs[collection].find((x) => x.code === code);
      if (!r) throw Error(`Missing ${collection}:${code}`);
      return r;
    };
    const geo = (code) => {
      const city = ref("cities", code);
      return {
        countryId: ref("countries", "IR")._id,
        provinceId: city.provinceId,
        cityId: city._id,
        districtId: refs.districts.find(
          (x) => String(x.cityId) === String(city._id),
        )?._id,
        cityRegionIds: refs.city_regions
          .filter((x) => String(x.cityId) === String(city._id))
          .slice(0, 1)
          .map((x) => x._id),
      };
    };
    const owner = add("User", "owner", {
      phone: "scenario:owner",
      firstName: "مدیر",
      lastName: "سناریوها",
      roles: ["athlete", "owner"],
      status: "suspended",
    });
    const athletes = Array.from({ length: 12 }, (_, i) =>
      add("User", `athlete-${i}`, {
        phone: `scenario:athlete:${i}`,
        firstName: "ورزشکار سناریویی",
        lastName: String(i + 1),
        roles: ["athlete"],
        status: "suspended",
      }),
    );
    const clubSpecs = [
      ["GYM", "BODYBUILDING", "TEHRAN_CITY", "بدنسازی قدرت", "men", "DUMBBELL"],
      [
        "STUDIO",
        "YOGA",
        "SHIRAZ",
        "استودیو آرامش بانوان",
        "women",
        "EXERCISE_MAT",
      ],
      [
        "POOL",
        "SWIMMING",
        "KARAJ",
        "استخر آموزش خانواده",
        "family",
        "KICKBOARD",
      ],
      [
        "SPORT_COMPLEX",
        "FITNESS",
        "ISFAHAN_CITY",
        "مجموعه چندمنظوره",
        "mixed",
        "TREADMILL",
      ],
      [
        "ACADEMY",
        "GYMNASTICS",
        "MASHHAD",
        "آکادمی کودکان",
        "children",
        "EXERCISE_MAT",
      ],
      [
        "MARTIAL_ARTS",
        "BOXING",
        "TEHRAN_CITY",
        "آکادمی رزمی",
        "mixed",
        "PUNCHING_BAG",
      ],
      [
        "FOOTBALL_FIELD",
        "FOOTBALL",
        "RASHT",
        "زمین فوتبال روباز",
        "men",
        "FOOTBALL_BALL",
      ],
      ["TENNIS", "TENNIS", "SHIRAZ", "تنیس فضای باز", "mixed", "TENNIS_RACKET"],
      [
        "VOLLEYBALL",
        "VOLLEYBALL",
        "TABRIZ",
        "سالن والیبال",
        "women",
        "VOLLEYBALL_BALL",
      ],
      [
        "BASKETBALL_HALL",
        "BASKETBALL",
        "TEHRAN_CITY",
        "سالن بسکتبال",
        "mixed",
        "BASKETBALL_BALL",
      ],
      [
        "FUTSAL_HALL",
        "FUTSAL",
        "KARAJ",
        "فوتسال در حال تعمیر",
        "men",
        "FOOTBALL_BALL",
      ],
      [
        "AQUATIC_CENTER",
        "SWIMMING",
        "ISFAHAN_CITY",
        "مرکز آبی تعطیل موقت",
        "family",
        "KICKBOARD",
      ],
      [
        "CLIMBING_GYM",
        "CLIMBING",
        "MASHHAD",
        "سنگ‌نوردی در انتظار بررسی",
        "mixed",
        "EXERCISE_MAT",
      ],
      [
        "PADEL_CLUB",
        "PADEL",
        "SHIRAZ",
        "پدل پیش‌نویس",
        "mixed",
        "PADEL_RACKET",
      ],
      [
        "CYCLING_TRACK",
        "CYCLING",
        "TABRIZ",
        "پیست دوچرخه‌سواری ردشده",
        "mixed",
        "STATIONARY_BIKE",
      ],
    ];
    const clubs = clubSpecs.map(
      ([type, sport, city, name, audience, equipment], i) => {
        const state =
          i === 12
            ? "pending"
            : i === 13
              ? "draft"
              : i === 14
                ? "rejected"
                : "approved";
        const operationalStatus =
          i === 10
            ? "under_maintenance"
            : i === 11
              ? "temporarily_closed"
              : "active";
        const hours = Array.from({ length: 7 }, (_, dayOfWeek) => ({
          dayOfWeek,
          isClosed: dayOfWeek === 5,
          periods:
            dayOfWeek === 5
              ? []
              : [
                  {
                    opensAt: i % 2 ? "08:00" : "06:00",
                    closesAt: i % 2 ? "21:00" : "23:00",
                  },
                ],
        }));
        const club = add("Club", `club-${i}`, {
          ownerId: owner._id,
          name: title(name),
          normalizedName: title(name),
          slug: `scenario-${type.toLowerCase().replaceAll("_", "-")}`,
          shortDescription: `${note} ${ref("sports", sport).name}`,
          description: `${note}\n${name}؛ برای بررسی فیلتر رشته، شهر، مخاطب، امکانات و وضعیت پذیرش.`,
          geo: geo(city),
          address: `${ref("cities", city).name}؛ نشانی سناریویی، قابل مراجعه نیست`,
          timezone: "Asia/Tehran",
          clubTypeIds: [ref("club_types", type)._id],
          sportIds: [ref("sports", sport)._id],
          audience: [audience],
          weeklyHours: hours,
          reviewStatus: state,
          operationalStatus,
          visibility: state === "approved" ? "public" : "hidden",
          qualityStatus: state === "approved" ? "active" : "review_required",
          rejectionReason: state === "rejected" ? "سناریوی نقص مدارک" : null,
          publishedAt: state === "approved" ? anchor : undefined,
          equipment: [
            {
              resourceId: ref("equipment", equipment)._id,
              quantity: 10,
              reservableQuantity: 4,
              status: i === 10 ? "maintenance" : "available",
            },
          ],
          amenities: [
            "LOCKER_ROOM",
            "SHOWER",
            ...(i % 2 ? ["WHEELCHAIR_ACCESS"] : ["PARKING"]),
          ].map((code) => ({
            resourceId: ref("amenities", code)._id,
            availability: "included",
          })),
          rules: ["این رکورد برای ارزیابی سناریوهای سامانه است."],
          faqs: [{ question: "این مجموعه واقعی است؟", answer: note }],
          profile: {
            trainingAreaSquareMeters: 150 + i * 30,
            wheelchairAccess: i % 2 ? "yes" : "partial",
            classCapacity: 12,
            spaces: [
              {
                name: "فضای تمرین",
                roofType: i === 6 || i === 7 ? "open" : "covered",
                areaSquareMeters: 150 + i * 30,
                ...(type === "POOL"
                  ? {
                      poolLengthMeters: 25,
                      poolLaneCount: 4,
                      poolMinDepthMeters: 1,
                      poolMaxDepthMeters: 2,
                    }
                  : {}),
              },
            ],
            firstVisit: {
              requiredItems: ["لباس ورزشی", "حوله"],
              arrivalMinutesBefore: 15,
              instructions: note,
              visitAvailable: false,
            },
          },
          trialBookingEnabled: i === 0,
          currency: "IRR",
          schemaVersion: 2,
          createdBy: owner._id,
          updatedBy: owner._id,
        });
        add("ClubMembership", `owner-member-${i}`, {
          clubId: club._id,
          userId: owner._id,
          role: "owner",
          status: "accepted",
          invitedBy: owner._id,
          acceptedAt: anchor,
        });
        return club;
      },
    );
    const courts = clubs.map((club, i) =>
      add("Court", `court-${i}`, {
        clubId: club._id,
        name: title("فضای " + (i + 1)),
        normalizedName: `scenario-court-${i}`,
        description: note,
        sportIds: club.sportIds,
        capacity: i === 6 ? 22 : 12,
        environment: i === 6 || i === 7 ? "outdoor" : "indoor",
        isReservable: i < 10,
        status: i < 10 ? "active" : "inactive",
        minimumReservationMinutes: 60,
        maximumReservationMinutes: 120,
      }),
    );
    const coachSpecs = [
      ["مربی قدرت", "BODYBUILDING", 0, ["club"], "approved", 12],
      ["مربی یوگا", "YOGA", 1, ["club", "online"], "approved", 8],
      ["مربی شنا", "SWIMMING", 2, ["club"], "approved", 10],
      ["مربی تناسب اندام", "FITNESS", 3, ["home", "online"], "approved", 5],
      ["مربی کودکان", "GYMNASTICS", 4, ["club"], "approved", 6],
      ["مربی بوکس", "BOXING", 5, ["club"], "approved", 9],
      ["مربی فوتبال", "FOOTBALL", 6, ["outdoor"], "approved", 7],
      ["مربی تنیس", "TENNIS", 7, ["club"], "approved", 4],
      ["مربی تازه‌کار", "VOLLEYBALL", 8, ["club"], "approved", 0],
      ["مربی در انتظار تأیید", "BASKETBALL", 9, ["club"], "pending_review", 3],
      ["مربی پیش‌نویس", "FUTSAL", 10, ["online"], "draft", 2],
      ["مربی ردشده", "SWIMMING", 11, ["online"], "rejected", 1],
    ];
    const coaches = coachSpecs.map(
      ([name, sport, clubIndex, modes, state, years], i) => {
        const user = add("User", `coach-user-${i}`, {
          phone: `scenario:coach:${i}`,
          firstName: "مربی سناریویی",
          lastName: String(i + 1),
          roles: ["athlete", "coach"],
          status: "suspended",
        });
        const coach = add("Coach", `coach-${i}`, {
          userId: user._id,
          displayName: title(name),
          slug: `scenario-coach-${i + 1}`,
          shortBio: `${note} ${name}`,
          bio: note,
          geo: clubs[clubIndex].geo,
          experienceYears: years,
          languages: i % 2 ? ["فارسی", "English"] : ["فارسی"],
          serviceModes: modes,
          minAcceptedAge: i === 4 ? 7 : 18,
          maxAcceptedAge: i === 4 ? 14 : 65,
          travelRadiusKm: modes.includes("home") ? 8 : 0,
          reviewStatus: state,
          visibility: state === "approved" ? "public" : "hidden",
          rejectionReason: state === "rejected" ? "سناریوی مدرک ناکافی" : null,
          specialties: [
            {
              title: ref("sports", sport).name,
              description: note,
              icon: "target",
            },
          ],
          professionalProfile: {
            audience: i === 4 ? "کودکان ۷ تا ۱۴ سال" : "بزرگسالان",
            goals: ["یادگیری تکنیک", "آمادگی جسمانی"],
            levels: i === 8 ? ["beginner"] : ["beginner", "intermediate"],
            firstSession: "ارزیابی اولیه سناریویی",
            planning: "برنامه هفتگی سناریویی",
            followUp: "ثبت بازخورد جلسه",
            progressTracking: "ثبت جلسات و بررسی پیشرفت",
          },
          faqs: [{ question: "این مربی واقعی است؟", answer: note }],
        });
        add("CoachSport", `coach-sport-${i}`, {
          coachId: coach._id,
          sportId: ref("sports", sport)._id,
          experienceYears: years,
          verificationStatus: i === 9 ? "pending" : "unverified",
        });
        if (modes.includes("club"))
          add("ClubMembership", `coach-member-${i}`, {
            clubId: clubs[clubIndex]._id,
            userId: user._id,
            coachId: coach._id,
            role: "coach",
            status: "accepted",
            invitedBy: owner._id,
            acceptedAt: anchor,
          });
        for (const dayOfWeek of [0, 2, 4])
          add("CoachAvailabilityRule", `availability-${i}-${dayOfWeek}`, {
            coachId: coach._id,
            dayOfWeek,
            startMinute: 540,
            endMinute: 720,
            deliveryModes: modes,
            ...(modes.includes("club") ? { clubId: clubs[clubIndex]._id } : {}),
            validFrom: at(0),
            validUntil: at(90),
            isActive: state === "approved",
          });
        add("CoachOffering", `offering-${i}`, {
          coachId: coach._id,
          sportId: ref("sports", sport)._id,
          title: title(
            ["جلسه خصوصی", "نیمه‌خصوصی", "گروهی", "ارزیابی اولیه"][i % 4],
          ),
          normalizedTitle: `scenario-offering-${i}`,
          description: note,
          type: ["private", "semi_private", "group", "assessment"][i % 4],
          deliveryModes: modes,
          durationMinutes: 60,
          capacity: [1, 2, 8, 1][i % 4],
          price: {
            amount: i === 8 ? 0 : 1200000 + i * 200000,
            currency: "IRR",
          },
          pricingType: i % 3 === 0 ? "package" : "per_session",
          ...(i % 3 === 0 ? { sessionCount: 4 } : {}),
          venueClubIds: modes.includes("club") ? [clubs[clubIndex]._id] : [],
          status: state === "approved" ? "published" : "draft",
          cancellationPolicy: policy,
        });
        return coach;
      },
    );
    const classSpecs = [
      ["ثبت‌نام آزاد مبتدی", 0, "club", "published", 8, 0, 18000000],
      ["یوگای آنلاین رایگان", 1, "online", "published", 12, 2, 0],
      ["شنای ظرفیت تکمیل", 2, "club", "published", 3, 3, 0],
      ["تمرین خانگی خصوصی", 3, "home", "published", 1, 0, 2400000],
      ["ژیمناستیک کودکان", 4, "club", "published", 8, 0, 12000000],
      ["بوکس پیشرفته", 5, "club", "published", 10, 0, 22000000],
      ["فوتبال فضای باز", 6, "outdoor", "published", 22, 0, 8000000],
      ["تنیس ثبت‌نام بسته", 7, "club", "registration_closed", 6, 0, 16000000],
      ["والیبال شروع نشده", 8, "club", "draft", 12, 0, 10000000],
      ["بدنسازی در حال برگزاری", 0, "club", "in_progress", 8, 0, 0],
      ["یوگای پایان‌یافته", 1, "online", "completed", 8, 0, 0],
      ["شنای لغوشده", 2, "club", "cancelled", 8, 0, 0],
      ["آمادگی جسمانی بایگانی", 3, "online", "archived", 8, 0, 0],
      ["ثبت‌نام از هفته آینده", 0, "club", "published", 8, 0, 17000000],
    ];
    const classes = classSpecs.map(
      ([name, ci, mode, state, capacity, enrolled, amount], i) => {
        const historical = ["completed", "cancelled", "archived"].includes(
          state,
        );
        const start = openDay(
          at(
            historical
              ? -30
              : state === "in_progress"
                ? -7
                : i === 13
                  ? 14
                  : 3 + i,
            10,
          ),
        );
        const end = at(historical ? -2 : 40 + i, 11);
        const venue =
          mode === "club"
            ? {
                clubId: clubs[ci]._id,
                courtId: courts[ci]._id,
                address: clubs[ci].address,
              }
            : { address: note };
        const cls = add("TrainingClass", `class-${i}`, {
          ownerCoachId: coaches[ci]._id,
          title: title(name),
          normalizedTitle: `scenario-class-${i}`,
          slug: `scenario-class-${i + 1}`,
          description: note,
          sportId: clubs[ci].sportIds[0],
          coachAssignments: [{ coachId: coaches[ci]._id, role: "primary" }],
          deliveryMode: mode,
          venue,
          ...(mode === "club"
            ? { clubId: clubs[ci]._id, courtId: courts[ci]._id }
            : {}),
          capacity,
          enrollmentCount: enrolled,
          registrationStartAt: at(
            historical
              ? -40
              : state === "in_progress"
                ? -10
                : i === 13
                  ? 7
                  : -2,
          ),
          registrationEndAt: at(
            historical
              ? -31
              : state === "in_progress"
                ? -8
                : state === "registration_closed"
                  ? -1
                  : i === 13
                    ? 13
                    : 2 + i,
          ),
          courseStartAt: start,
          courseEndAt: end,
          plannedSessionCount: 2,
          price: { amount, currency: "IRR" },
          enrollmentMode: i % 2 ? "requires_approval" : "automatic",
          status: state,
          clubApprovalStatus: mode === "club" ? "approved" : "not_required",
          skillLevelId: ref("skill_levels", i === 5 ? "ADVANCED" : "BEGINNER")
            ._id,
          prerequisites: [i === 4 ? "سن ۷ تا ۱۴ سال" : "لباس ورزشی مناسب"],
          tags: ["سناریویی"],
          cancellationPolicy: policy,
        });
        for (let j = 0; j < enrolled; j++)
          add("ClassEnrollment", `enrollment-${i}-${j}`, {
            classId: cls._id,
            coachId: coaches[ci]._id,
            athleteId: athletes[j]._id,
            createdBy: owner._id,
            status: "active",
            priceSnapshot: { amount: 0, currency: "IRR" },
            paymentStatus: "not_required",
            registeredAt: anchor,
          });
        for (let j = 0; j < 2; j++) {
          const date = new Date(start.getTime() + j * 7 * 86400000);
          const session = add("TrainingSession", `class-session-${i}-${j}`, {
            classId: cls._id,
            ownerCoachId: coaches[ci]._id,
            coachAssignments: cls.coachAssignments,
            sportId: cls.sportId,
            title: title(`${name}، جلسه ${j + 1}`),
            startAt: date,
            endAt: new Date(date.getTime() + 3600000),
            deliveryMode: mode,
            venue,
            capacity,
            bookedCount: enrolled === capacity ? capacity : 0,
            status:
              state === "cancelled"
                ? "cancelled"
                : historical || date < anchor
                  ? "completed"
                  : enrolled === capacity
                    ? "full"
                    : "scheduled",
            publicNotes: note,
          });
          if (enrolled === capacity)
            for (let k = 0; k < capacity; k++)
              add("SessionBooking", `class-booking-${i}-${j}-${k}`, {
                sessionId: session._id,
                classId: cls._id,
                coachId: coaches[ci]._id,
                athleteId: athletes[k]._id,
                status: "confirmed",
                priceSnapshot: { amount: 0, currency: "IRR" },
                paymentStatus: "not_required",
                createdBy: owner._id,
              });
        }
        return cls;
      },
    );
    // Session occupancy is backed by corresponding no-payment reservations.
    for (let i = 0; i < 10; i++)
      for (let j = 0; j < 3; j++) {
        const full = i === 0 && j === 1,
          past = j === 2;
        const slot = add("ReservableSession", `slot-${i}-${j}`, {
          clubId: clubs[i]._id,
          courtId: courts[i]._id,
          title: title(
            past
              ? "سانس پایان‌یافته"
              : full
                ? "سانس رایگان تکمیل"
                : "سانس قابل رزرو",
          ),
          startsAt: openDay(at(past ? -2 : j + 1, 9 + (i % 3))),
          endsAt: openDay(at(past ? -2 : j + 1, 10 + (i % 3))),
          capacity: full ? 2 : 12,
          reservedCount: full ? 2 : 0,
          basePrice: full || past ? 0 : 600000 + i * 100000,
          pricingUnit: i === 6 || i === 7 ? "per_court" : "per_participant",
          status: past ? "completed" : "active",
          cancellationPolicy: policy,
        });
        if (full)
          for (let k = 0; k < 2; k++)
            add("Reservation", `slot-reservation-${i}-${j}-${k}`, {
              clubId: clubs[i]._id,
              sessionId: slot._id,
              userId: athletes[k]._id,
              sessionType: "court",
              sessionTitle: slot.title,
              sessionStartsAt: slot.startsAt,
              sessionEndsAt: slot.endsAt,
              participantCount: 1,
              totalPrice: 0,
              paymentStatus: "not_required",
              status: "reserved",
              cancellationPolicy: policy,
              reminder24hSentAt: anchor,
              reminder2hSentAt: anchor,
            });
        if (past && i < 3) {
          const reservation = add("Reservation", `past-reservation-${i}`, {
            clubId: clubs[i]._id,
            sessionId: slot._id,
            userId: athletes[i]._id,
            sessionType: "court",
            sessionTitle: slot.title,
            sessionStartsAt: slot.startsAt,
            sessionEndsAt: slot.endsAt,
            participantCount: 1,
            totalPrice: 0,
            paymentStatus: "not_required",
            status: "completed",
            cancellationPolicy: policy,
          });
          const rating = [5, 3, 1][i];
          add("ClubReview", `review-${i}`, {
            clubId: clubs[i]._id,
            userId: athletes[i]._id,
            reservationId: reservation._id,
            rating,
            title: title(["بازخورد مثبت", "بازخورد متوسط", "بازخورد منفی"][i]),
            body: note,
            isVerifiedBooking: false,
            status: "published",
          });
          clubs[i].averageRating = rating;
          clubs[i].reviewsCount = 1;
        }
        if (j === 0)
          for (let k = 0; k < 2; k++)
            add("BenefitProduct", `product-${i}-${k}`, {
              clubId: clubs[i]._id,
              title: title(k ? "عضویت سی‌روزه" : "بسته هشت‌جلسه‌ای"),
              description: note,
              type: k ? "time_membership" : "session_pack",
              price: k ? 15000000 : 8000000,
              sessionCount: k ? null : 8,
              validityDays: k ? 30 : 60,
              maxPauseDays: k ? 7 : 0,
              weeklyLimit: k ? 3 : null,
              sessionTypes: ["court", "class", "coached_session"],
              weekCalendar: "iran_saturday",
              status: i === 9 ? "inactive" : "active",
            });
      }
    // Business-owned classes, branches, coach profiles, students and waitlist scenarios.
    for (let i = 0; i < 8; i++) {
      const branch = add("ClubBranch", `branch-${i}`, {
        clubId: clubs[i]._id,
        name: title("شعبه اصلی"),
        address: clubs[i].address,
        phone: "",
        status: "active",
      });
      const profile = add("ClubCoachProfile", `staff-${i}`, {
        clubId: clubs[i]._id,
        userId: coaches[i].userId,
        firstName: "مربی",
        lastName: `سناریویی ${i + 1}`,
        phone: `scenario:coach:${i}`,
        specialties: [ref("sports", clubSpecs[i][1]).name],
        employmentType: i % 2 ? "پاره‌وقت" : "تمام‌وقت",
        notes: note,
      });
      const full = i === 2;
      const cls = add("BusinessTrainingClass", `business-class-${i}`, {
        clubId: clubs[i]._id,
        title: title(
          [
            "گروهی ماهانه",
            "خصوصی تک‌جلسه",
            "دوره با فهرست انتظار",
            "جلسه آزاد",
            "بسته تمرین",
            "کلاس پیش‌نویس",
            "کلاس متوقف",
            "کلاس لغوشده",
          ][i],
        ),
        description: note,
        sport: ref("sports", clubSpecs[i][1]).name,
        level: "مبتدی",
        skillLevelId: ref("skill_levels", "BEGINNER")._id,
        classModel: [
          "group",
          "private",
          "course",
          "single",
          "open",
          "group",
          "group",
          "course",
        ][i],
        pricingModel: [
          "monthly",
          "per_session",
          "course",
          "per_session",
          "package",
          "monthly",
          "monthly",
          "course",
        ][i],
        price: full ? 0 : 12000000,
        currency: "IRR",
        packageSessionCount: i === 4 ? 8 : null,
        capacity: full ? 2 : i === 1 ? 1 : 12,
        activeEnrollmentCount: full ? 2 : 0,
        coachProfileId: profile._id,
        branchId: branch._id,
        startDate: at(3),
        endDate: at(31),
        registrationStartAt: at(-1),
        registrationEndAt: at(2),
        schedule: [
          { dayOfWeek: 0, startTime: "16:00", durationMinutes: 60 },
          { dayOfWeek: 2, startTime: "16:00", durationMinutes: 60 },
        ],
        visibility: i === 5 ? "private" : "public",
        status:
          i === 5
            ? "draft"
            : i === 6
              ? "paused"
              : i === 7
                ? "cancelled"
                : "active",
        enrollmentMode: i % 2 ? "requires_approval" : "automatic",
      });
      for (let j = 0; j < 3; j++) {
        const student = add("ClubStudent", `student-${i}-${j}`, {
          clubId: clubs[i]._id,
          userId: athletes[j]._id,
          firstName: "هنرجوی سناریویی",
          lastName: String(j + 1),
          phone: `scenario:student:${j}`,
          sport: cls.sport,
          notes: note,
        });
        if (full)
          add("BusinessClassEnrollment", `business-enrollment-${i}-${j}`, {
            clubId: clubs[i]._id,
            classId: cls._id,
            studentId: student._id,
            status: j === 2 ? "waitlisted" : "active",
            agreedPrice: 0,
            paymentStatus: "waived",
            createdBy: owner._id,
            waitlistRequestedAt: j === 2 ? anchor : null,
          });
      }
      if (i < 5) {
        let n = 0;
        for (let d = 3; d <= 31; d++) {
          const start = at(d, 12);
          start.setUTCMinutes(30);
          if (![0, 2].includes(start.getUTCDay())) continue;
          add("BusinessClassSession", `business-session-${i}-${n++}`, {
            classId: cls._id,
            clubId: clubs[i]._id,
            startsAt: start,
            endsAt: new Date(start.getTime() + 3600000),
            capacity: cls.capacity,
            status: "scheduled",
            reminder24hSentAt: anchor,
            reminder2hSentAt: anchor,
          });
        }
      }
    }
    if (refs.article_categories.length)
      for (let i = 0; i < 3; i++)
        add("Article", `article-${i}`, {
          title: title(
            ["راهنمای بررسی باشگاه", "راهنمای انتخاب مربی", "مقاله پیش‌نویس"][
              i
            ],
          ),
          slug: `scenario-article-${i + 1}`,
          authorName: "تیم سناریو",
          categoryId:
            refs.article_categories[i % refs.article_categories.length]._id,
          excerpt: note,
          bodyHtml: `<p>${note}</p><p>این محتوا برای بررسی فهرست، جزئیات و وضعیت انتشار مقاله ایجاد شده است.</p>`,
          status: i === 2 ? "draft" : "published",
          publishedAt: i === 2 ? null : anchor,
        });
    const entries = (name) =>
      docs.filter((x) => x.collection === name).map((x) => x.doc);
    for (const cls of entries("classes")) {
      if (
        cls.courseStartAt >= cls.courseEndAt ||
        cls.registrationStartAt >= cls.registrationEndAt ||
        cls.registrationEndAt > cls.courseStartAt
      )
        throw Error(`Invalid class dates: ${cls.seedKey}`);
      const count = entries("class_enrollments").filter(
        (e) => String(e.classId) === String(cls._id) && e.status === "active",
      ).length;
      if (cls.enrollmentCount !== count || count > cls.capacity)
        throw Error(`Invalid class occupancy: ${cls.seedKey}`);
    }
    for (const slot of entries("reservable_sessions")) {
      const count = entries("session_reservations")
        .filter(
          (r) =>
            String(r.sessionId) === String(slot._id) && r.status === "reserved",
        )
        .reduce((n, r) => n + r.participantCount, 0);
      if (
        slot.reservedCount !== count ||
        count > slot.capacity ||
        slot.startsAt >= slot.endsAt
      )
        throw Error(`Invalid slot: ${slot.seedKey}`);
    }
    for (const session of entries("class_sessions")) {
      const count = entries("session_bookings").filter(
        (b) =>
          String(b.sessionId) === String(session._id) &&
          b.status === "confirmed",
      ).length;
      if (
        session.bookedCount !== count ||
        count > session.capacity ||
        session.startAt >= session.endAt
      )
        throw Error(`Invalid session: ${session.seedKey}`);
    }
    for (const cls of entries("business_training_classes")) {
      const count = entries("business_class_enrollments").filter(
        (e) => String(e.classId) === String(cls._id) && e.status === "active",
      ).length;
      if (cls.activeEnrollmentCount !== count || count > cls.capacity)
        throw Error(`Invalid business occupancy: ${cls.seedKey}`);
    }
    const seen = new Set();
    for (const { doc } of docs) {
      if (seen.has(String(doc._id))) throw Error("Duplicate seed ID");
      seen.add(String(doc._id));
    }
    // Revalidate aggregates after deriving review values, and verify all foreign IDs exist.
    const refIds = new Set(
      Object.values(refs)
        .flat()
        .map((x) => String(x._id)),
    );
    function validateRefs(value) {
      if (value instanceof mongoose.Types.ObjectId) {
        if (!seen.has(String(value)) && !refIds.has(String(value)))
          throw Error(`Unresolved reference ${value}`);
      } else if (Array.isArray(value)) value.forEach(validateRefs);
      else if (value && typeof value === "object" && !(value instanceof Date)) {
        for (const [key, v] of Object.entries(value))
          if (key !== "_id") validateRefs(v);
      }
    }
    docs.forEach(({ doc }) => validateRefs(doc));
    const summary = {};
    for (const { collection, doc } of docs) {
      summary[collection] ??= { planned: 0, existing: 0 };
      summary[collection].planned++;
      const existing = await db
        .collection(collection)
        .findOne({ _id: doc._id }, { projection: { seedBatch: 1 } });
      if (existing) {
        if (existing.seedBatch !== SEED)
          throw Error(`ID collision in ${collection}`);
        summary[collection].existing++;
      }
    }
    const totalExisting = Object.values(summary).reduce(
      (s, x) => s + x.existing,
      0,
    );
    if (totalExisting !== 0 && totalExisting !== docs.length)
      throw Error("Partial existing batch; inspect before applying");
    // Check deployed unique indexes before attempting the atomic insertion.
    if (totalExisting === 0)
      for (const { collection, doc } of docs) {
        const indexes = await db
          .collection(collection)
          .listIndexes()
          .toArray()
          .catch((e) => {
            if (e.code === 26) return [];
            throw e;
          });
        for (const index of indexes.filter(
          (i) => i.unique && i.name !== "_id_",
        )) {
          const keys = Object.keys(index.key);
          if (keys.some((k) => k.includes(".") || doc[k] == null)) continue;
          const filter = Object.fromEntries(keys.map((k) => [k, doc[k]]));
          if (
            await db
              .collection(collection)
              .findOne(filter, { projection: { _id: 1 } })
          )
            throw Error(`Unique index collision: ${collection}.${index.name}`);
        }
      }
    if (process.argv.includes("--apply") && totalExisting === 0) {
      const session = client.startSession();
      try {
        await session.withTransaction(async () => {
          for (const collection of Object.keys(summary))
            await db.collection(collection).insertMany(
              docs.filter((x) => x.collection === collection).map((x) => x.doc),
              { session },
            );
          await db
            .collection("scenario_seed_runs")
            .insertOne(
              {
                _id: SEED,
                anchor,
                createdAt: new Date(),
                counts: summary,
                description: note,
              },
              { session },
            );
        });
      } finally {
        await session.endSession();
      }
    }
    const applied =
      process.argv.includes("--apply") || totalExisting === docs.length;
    if (applied)
      for (const [collection, count] of Object.entries(summary)) {
        const actual = await db
          .collection(collection)
          .countDocuments({
            _id: {
              $in: docs
                .filter((x) => x.collection === collection)
                .map((x) => x.doc._id),
            },
            seedBatch: SEED,
          });
        if (actual !== count.planned)
          throw Error(`Post-write mismatch: ${collection}`);
        count.verified = actual;
      }
    console.log(
      JSON.stringify(
        {
          seedBatch: SEED,
          mode: process.argv.includes("--apply") ? "apply" : "preflight",
          anchor,
          total: docs.length,
          summary,
          examples: {
            club: clubs[0].slug,
            coach: coaches[0].slug,
            class: classes[0].slug,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
