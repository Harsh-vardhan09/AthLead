import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import { User, Participation } from "../models/Users.js";
import Score from "../models/Score.js";
import { getAthletes, getAthleteById } from "../controllers/adminController.js";

const createMockResponse = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

test("getAthletes returns count 0 and empty list when no users exist", async () => {
  const originalUserFind = User.find;
  const originalScoreFind = Score.find;
  const originalParticipationFind = Participation.find;

  User.find = (query) => {
    if (query?.role?.$ne === "ADMIN" && Object.keys(query).length === 1) {
      return {
        distinct: async () => [],
        select: () => ({
          lean: async () => [],
        }),
      };
    }
    return {
      select: () => ({
        lean: async () => [],
      }),
    };
  };

  Score.find = () => ({
    sort: () => ({
      lean: async () => [],
    }),
  });

  Participation.find = () => ({
    populate: () => ({
      lean: async () => [],
    }),
  });

  try {
    const req = { query: {} };
    const res = createMockResponse();
    let nextCalled = false;

    await getAthletes(req, res, (err) => {
      nextCalled = true;
      throw err;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      success: true,
      count: 0,
      athletes: [],
    });
  } finally {
    User.find = originalUserFind;
    Score.find = originalScoreFind;
    Participation.find = originalParticipationFind;
  }
});

test("getAthletes filters out users with role ADMIN and applies default fields", async () => {
  const originalUserFind = User.find;
  const originalScoreFind = Score.find;
  const originalParticipationFind = Participation.find;

  let capturedUserQuery = null;
  const athleteId1 = new mongoose.Types.ObjectId();
  const mockUsers = [
    {
      _id: athleteId1,
      fullname: "Alex Runner",
      email: "alex@example.com",
      role: "USER",
      createdAt: new Date(2026, 0, 15),
    },
  ];

  User.find = (query) => {
    if (query?.role?.$ne === "ADMIN" && !capturedUserQuery) {
      capturedUserQuery = query;
      return {
        select: () => ({
          lean: async () => mockUsers,
        }),
      };
    }
    return {
      distinct: async () => [athleteId1],
      select: () => ({
        lean: async () => mockUsers,
      }),
    };
  };

  Score.find = () => ({
    sort: () => ({
      lean: async () => [],
    }),
  });

  Participation.find = () => ({
    populate: () => ({
      lean: async () => [],
    }),
  });

  try {
    const req = { query: {} };
    const res = createMockResponse();

    await getAthletes(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.count, 1);
    assert.equal(capturedUserQuery.role.$ne, "ADMIN");

    const athlete = res.body.athletes[0];
    assert.equal(athlete.fullname, "Alex Runner");
    assert.equal(athlete.email, "alex@example.com");
    assert.equal(athlete.accountType, "Athlete");
    assert.equal(athlete.gender, "Not specified");
    assert.equal(athlete.state, "Not specified");
    assert.equal(athlete.DOB, "N/A");
    assert.equal(athlete.status, "Active");
    assert.equal(athlete.joinDate, "2026-01-15");
    assert.deepEqual(athlete.scoreSummary, {
      potentialScore: 0,
      currentRank: "-",
      trend: "0",
    });
    assert.deepEqual(athlete.eventParticipation, []);
  } finally {
    User.find = originalUserFind;
    Score.find = originalScoreFind;
    Participation.find = originalParticipationFind;
  }
});

test("getAthletes handles status filter for Active including null and missing status", async () => {
  const originalUserFind = User.find;
  const originalScoreFind = Score.find;
  const originalParticipationFind = Participation.find;

  let capturedQuery = null;

  User.find = (query) => {
    if (!capturedQuery) {
      capturedQuery = query;
    }
    return {
      distinct: async () => [],
      select: () => ({
        lean: async () => [],
      }),
    };
  };

  Score.find = () => ({
    sort: () => ({
      lean: async () => [],
    }),
  });

  Participation.find = () => ({
    populate: () => ({
      lean: async () => [],
    }),
  });

  try {
    const req = { query: { status: "Active" } };
    const res = createMockResponse();

    await getAthletes(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.ok(capturedQuery.$and, "Expected $and condition in user query");
    assert.deepEqual(capturedQuery.$and[0], { role: { $ne: "ADMIN" } });
    assert.deepEqual(capturedQuery.$and[1], {
      $or: [
        { status: "Active" },
        { status: { $exists: false } },
        { status: null },
      ],
    });
  } finally {
    User.find = originalUserFind;
    Score.find = originalScoreFind;
    Participation.find = originalParticipationFind;
  }
});

test("getAthletes handles custom status filter such as Injured", async () => {
  const originalUserFind = User.find;
  const originalScoreFind = Score.find;
  const originalParticipationFind = Participation.find;

  let capturedQuery = null;

  User.find = (query) => {
    if (!capturedQuery) {
      capturedQuery = query;
    }
    return {
      distinct: async () => [],
      select: () => ({
        lean: async () => [],
      }),
    };
  };

  Score.find = () => ({
    sort: () => ({
      lean: async () => [],
    }),
  });

  Participation.find = () => ({
    populate: () => ({
      lean: async () => [],
    }),
  });

  try {
    const req = { query: { status: "Injured" } };
    const res = createMockResponse();

    await getAthletes(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.ok(capturedQuery.$and);
    assert.deepEqual(capturedQuery.$and[0], { role: { $ne: "ADMIN" } });
    assert.deepEqual(capturedQuery.$and[1], { status: "Injured" });
  } finally {
    User.find = originalUserFind;
    Score.find = originalScoreFind;
    Participation.find = originalParticipationFind;
  }
});

test("getAthletes sanitizes search query regex metacharacters and matches name and email", async () => {
  const originalUserFind = User.find;
  const originalScoreFind = Score.find;
  const originalParticipationFind = Participation.find;

  let capturedQuery = null;

  User.find = (query) => {
    if (!capturedQuery) {
      capturedQuery = query;
    }
    return {
      distinct: async () => [],
      select: () => ({
        lean: async () => [],
      }),
    };
  };

  Score.find = () => ({
    sort: () => ({
      lean: async () => [],
    }),
  });

  Participation.find = () => ({
    populate: () => ({
      lean: async () => [],
    }),
  });

  try {
    const req = { query: { search: "test+user(1)@domain.com" } };
    const res = createMockResponse();

    await getAthletes(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.ok(capturedQuery.$and);
    assert.deepEqual(capturedQuery.$and[0], { role: { $ne: "ADMIN" } });
    const orCondition = capturedQuery.$and[1].$or;
    assert.ok(orCondition[0].fullname instanceof RegExp);
    assert.ok(orCondition[1].email instanceof RegExp);
    assert.equal(
      orCondition[0].fullname.source,
      "test\\+user\\(1\\)@domain\\.com",
    );
  } finally {
    User.find = originalUserFind;
    Score.find = originalScoreFind;
    Participation.find = originalParticipationFind;
  }
});

test("getAthletes computes deduplicated ranks and potentialScores across athletes", async () => {
  const originalUserFind = User.find;
  const originalScoreFind = Score.find;
  const originalParticipationFind = Participation.find;

  const athleteId1 = new mongoose.Types.ObjectId();
  const athleteId2 = new mongoose.Types.ObjectId();
  const athleteId3 = new mongoose.Types.ObjectId();

  const mockUsers = [
    {
      _id: athleteId1,
      fullname: "Athlete One",
      email: "one@test.com",
      role: "USER",
    },
    {
      _id: athleteId2,
      fullname: "Athlete Two",
      email: "two@test.com",
      role: "USER",
    },
    {
      _id: athleteId3,
      fullname: "Athlete Three",
      email: "three@test.com",
      role: "USER",
    },
  ];

  User.find = (query) => {
    if (query?.role?.$ne === "ADMIN") {
      return {
        distinct: async () => [athleteId1, athleteId2, athleteId3],
        select: () => ({
          lean: async () => mockUsers,
        }),
      };
    }
    return {
      select: () => ({
        lean: async () => mockUsers,
      }),
    };
  };

  // Scores in sorted order: athlete1 has 95, athlete1 has 90 (older), athlete2 has 85
  // athlete3 has no score
  Score.find = () => ({
    sort: () => ({
      lean: async () => [
        { user: athleteId1, score: 95 },
        { user: athleteId1, score: 90 },
        { user: athleteId2, score: 85 },
      ],
    }),
  });

  Participation.find = () => ({
    populate: () => ({
      lean: async () => [],
    }),
  });

  try {
    const req = { query: {} };
    const res = createMockResponse();

    await getAthletes(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.count, 3);

    const a1 = res.body.athletes.find((a) => a.id === athleteId1.toString());
    const a2 = res.body.athletes.find((a) => a.id === athleteId2.toString());
    const a3 = res.body.athletes.find((a) => a.id === athleteId3.toString());

    // Athlete 1 should be rank 1 with score 95
    assert.deepEqual(a1.scoreSummary, {
      potentialScore: 95,
      currentRank: 1,
      trend: "+0",
    });

    // Athlete 2 should be rank 2 (deduplicated, not rank 3) with score 85
    assert.deepEqual(a2.scoreSummary, {
      potentialScore: 85,
      currentRank: 2,
      trend: "+0",
    });

    // Athlete 3 has no score: rank "-" and score 0
    assert.deepEqual(a3.scoreSummary, {
      potentialScore: 0,
      currentRank: "-",
      trend: "0",
    });
  } finally {
    User.find = originalUserFind;
    Score.find = originalScoreFind;
    Participation.find = originalParticipationFind;
  }
});

test("getAthletes maps event participation and formats event date", async () => {
  const originalUserFind = User.find;
  const originalScoreFind = Score.find;
  const originalParticipationFind = Participation.find;

  const athleteId = new mongoose.Types.ObjectId();
  const partId = new mongoose.Types.ObjectId();

  const mockUsers = [
    {
      _id: athleteId,
      fullname: "Marathon Runner",
      email: "runner@test.com",
      role: "USER",
    },
  ];

  User.find = () => ({
    distinct: async () => [athleteId],
    select: () => ({
      lean: async () => mockUsers,
    }),
  });

  Score.find = () => ({
    sort: () => ({
      lean: async () => [],
    }),
  });

  Participation.find = () => ({
    populate: () => ({
      lean: async () => [
        {
          _id: partId,
          user: athleteId,
          event: {
            title: "City Marathon",
            date: new Date(2026, 10, 10, 8),
          },
        },
      ],
    }),
  });

  try {
    const req = { query: {} };
    const res = createMockResponse();

    await getAthletes(req, res, () => {});

    assert.equal(res.statusCode, 200);
    const athlete = res.body.athletes[0];
    assert.equal(athlete.eventParticipation.length, 1);
    assert.deepEqual(athlete.eventParticipation[0], {
      id: partId.toString(),
      title: "City Marathon",
      date: "2026-11-10",
      result: "Participant",
    });
  } finally {
    User.find = originalUserFind;
    Score.find = originalScoreFind;
    Participation.find = originalParticipationFind;
  }
});

test("getAthletes passes database errors to next middleware", async () => {
  const originalUserFind = User.find;

  const dbError = new Error("Database connection lost");
  User.find = () => {
    throw dbError;
  };

  try {
    const req = { query: {} };
    const res = createMockResponse();
    let passedError = null;

    await getAthletes(req, res, (err) => {
      passedError = err;
    });

    assert.equal(passedError, dbError);
  } finally {
    User.find = originalUserFind;
  }
});

test("getAthleteById returns athlete profile with score and participations", async () => {
  const originalUserFindById = User.findById;
  const originalUserFind = User.find;
  const originalScoreFind = Score.find;
  const originalParticipationFind = Participation.find;

  const athleteId = new mongoose.Types.ObjectId();
  const partId = new mongoose.Types.ObjectId();

  const mockUser = {
    _id: athleteId,
    fullname: "Priya Sharma",
    email: "priya@example.com",
    phone: 9876543210,
    gender: "Female",
    state: "Karnataka",
    DOB: new Date(2002, 4, 20),
    status: "Active",
    role: "USER",
    createdAt: new Date(2026, 1, 1),
  };

  User.findById = () => ({
    select: () => ({
      lean: async () => mockUser,
    }),
  });

  User.find = () => ({
    distinct: async () => [athleteId],
  });

  Score.find = () => ({
    sort: () => ({
      lean: async () => [{ user: athleteId, score: 92.4 }],
    }),
  });

  Participation.find = () => ({
    populate: () => ({
      lean: async () => [
        {
          _id: partId,
          user: athleteId,
          event: {
            title: "State Badminton Open",
            date: new Date(2026, 11, 5),
          },
        },
      ],
    }),
  });

  try {
    const req = { params: { id: athleteId.toString() } };
    const res = createMockResponse();
    let nextCalled = false;

    await getAthleteById(req, res, (err) => {
      nextCalled = true;
      throw err;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);

    const { athlete } = res.body;
    assert.equal(athlete.fullname, "Priya Sharma");
    assert.equal(athlete.email, "priya@example.com");
    assert.equal(athlete.phone, "9876543210");
    assert.equal(athlete.gender, "Female");
    assert.equal(athlete.state, "Karnataka");
    assert.equal(athlete.DOB, "2002-05-20");
    assert.equal(athlete.joinDate, "2026-02-01");
    assert.deepEqual(athlete.scoreSummary, {
      potentialScore: 92.4,
      currentRank: 1,
      trend: "+0",
    });
    assert.equal(athlete.eventParticipation.length, 1);
    assert.equal(athlete.eventParticipation[0].title, "State Badminton Open");
    assert.equal(athlete.eventParticipation[0].date, "2026-12-05");
  } finally {
    User.findById = originalUserFindById;
    User.find = originalUserFind;
    Score.find = originalScoreFind;
    Participation.find = originalParticipationFind;
  }
});

test("getAthleteById returns HTTP 404 when athlete does not exist", async () => {
  const originalUserFindById = User.findById;

  User.findById = () => ({
    select: () => ({
      lean: async () => null,
    }),
  });

  try {
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
    const res = createMockResponse();
    let nextCalled = false;

    await getAthleteById(req, res, (err) => {
      nextCalled = true;
      throw err;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
      success: false,
      message: "Athlete not found",
    });
  } finally {
    User.findById = originalUserFindById;
  }
});

test("getAthleteById passes database errors to next middleware", async () => {
  const originalUserFindById = User.findById;

  const dbError = new Error("CastError: invalid object id");
  User.findById = () => {
    throw dbError;
  };

  try {
    const req = { params: { id: "bad-id" } };
    const res = createMockResponse();
    let passedError = null;

    await getAthleteById(req, res, (err) => {
      passedError = err;
    });

    assert.equal(passedError, dbError);
  } finally {
    User.findById = originalUserFindById;
  }
});
