const express = require("express");
const app = express();
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
app.use(express.json());
const dbPath = path.join(__dirname, "twitterClone.db");
let database = null;
const initializeDBandSERVER = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR ${e.message}`);
    process.exit(1);
  }
};
initializeDBandSERVER();
//api 1
app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const regQUERY = `
    SELECT * FROM user 
    WHERE username = '${username}';
  
  
  `;
  const regOUT = await database.get(regQUERY);
  if (regOUT !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const registerQUERY = `
        INSERT INTO user( username, password, name, gender)
        VALUES('${username}','${hashedPassword}','${name}','${gender}');
        
        
        `;
      const registerend = await database.run(registerQUERY);
      response.status(200);
      response.send("User created successfully");
    }
  }
});
module.exports = app;
//api 2
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const loQUERY = `
    SELECT * FROM user 
    WHERE username = '${username}';
  
  
  `;
  const loEND = await database.get(loQUERY);
  if (loEND === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, loEND.password);
    if (isPasswordMatched === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "surya");
      response.send({ jwtToken });
    }
  }
});
//auti

///authentication

const authentication = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  } else {
    response.status(401);
    response.send("Invalid JWT Token");
  }

  if (jwtToken !== undefined) {
    jwt.verify(jwtToken, "surya", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

//api 3

app.get("/user/tweets/feed/", authentication, async (request, response) => {
  /** get user id from username  */
  let { username } = request;
  const getUserIdQuery = `select user_id from user where username='${username}';`;
  const getUserId = await database.get(getUserIdQuery);
  //console.log(getUserId);
  /** get followers ids from user id  */
  const getFollowerIdsQuery = `select following_user_id from follower 
    where follower_user_id=${getUserId.user_id};`;
  const getFollowerIds = await database.all(getFollowerIdsQuery);
  // console.log(getFollowerIds);
  //get follower ids array
  const getFollowerIdsSimple = getFollowerIds.map((eachUser) => {
    return eachUser.following_user_id;
  });
  // console.log(getUserIds);
  // console.log(`${getUserIds}`);
  //query
  const getTweetQuery = `select user.username, tweet.tweet, tweet.date_time as dateTime 
      from user inner join tweet 
      on user.user_id= tweet.user_id where user.user_id in (${getFollowerIdsSimple})
       order by tweet.date_time desc limit 4 ;`;
  const responseResult = await database.all(getTweetQuery);
  //console.log(responseResult);
  response.send(responseResult);
});

//api 4
app.get("/user/following/", authentication, async (request, response) => {
  const { username } = request;
  const nak = `
  SELECT user_id FROM user 
  WHERE username = '${username}';
  `;
  const em = await database.get(nak);
  const radhu = `
  SELECT following_user_id FROM follower
  WHERE follower_user_id = ${em.user_id};
  
  
  `;
  const getFollowerIds = await database.all(radhu);

  const getFollowerIdsSimple = getFollowerIds.map((eachUser) => {
    return eachUser.following_user_id;
  });
  const nijam = `
  SELECT name FROM user 
  WHERE user_id IN (${getFollowerIdsSimple});
  
  `;
  const mawa = await database.all(nijam);
  response.send(mawa);
});
//api 5
app.get("/user/followers/", authentication, async (request, response) => {
  const { username } = request;
  const FIRSTQUERY = `
    SELECT user_id FROM user 
    WHERE username = '${username}';
  
  
  `;
  const FIRSTQUERYrun = await database.get(FIRSTQUERY);
  const follower = `
  SELECT follower_user_id FROM follower
  WHERE following_user_id = ${FIRSTQUERYrun.user_id};
  
  
  `;
  const followerRUN = await database.all(follower);
  const follwerRRR = followerRUN.map((each) => {
    return each.follower_user_id;
  });
  const lastQUERY = `
  SELECT name FROM user 
  WHERE user_id IN (${follwerRRR});
  
  `;
  const runningchey = await database.all(lastQUERY);
  response.send(runningchey);
});

//api 6

//api 7
const convertLikedUserNameDBObjectToResponseObject = (dbObject) => {
  return {
    likes: dbObject,
  };
};
app.get(
  "/tweets/:tweetId/likes/",
  authentication,
  async (request, response) => {
    const { username } = request;
    const { tweetId } = request.params;
    const kap = `
  SELECT user_id FROM user 
  WHERE username = '${username}';
  `;
    const kappa = await database.get(kap);
    const shannu = `
  SELECT following_user_id FROM follower
  WHERE follower_user_id = ${kappa.user_id};
  
  
  `;
    const harika = await database.all(shannu);
    const surya = harika.map((each) => {
      return each.following_user_id;
    });
    const TWEET = `
  SELECT tweet_id FROM tweet 
  WHERE user_id IN (${surya});
  
  `;
    const TWEETING = await database.all(TWEET);
    const TRS = TWEETING.map((xx) => {
      return xx.tweet_id;
    });
    if (TRS.includes(parseInt(tweetId))) {
      const BJP = `
       SELECT (user.username) AS username FROM 
       user INNER JOIN like ON user.user_id = like.user_id 
       WHERE like.tweet_id = '${tweetId}';
       
       
       `;
      const CONGO = await database.all(BJP);
      const thelvadhi = CONGO.map((ktr) => {
        return ktr.username;
      });
      response.send(convertLikedUserNameDBObjectToResponseObject(thelvadhi));
    } else {
      response.status(401);
      response.send("Invalid Request");
      console.log("Invalid Request");
    }
  }
);
//api 8
const convertLikedUserNameDBObjectToResponseObject1 = (dbObject) => {
  return {
    replies: dbObject,
  };
};
app.get(
  "/tweets/:tweetId/replies/",
  authentication,
  async (request, response) => {
    const { username } = request;
    const { tweetId } = request.params;
    const kap = `
  SELECT user_id FROM user 
  WHERE username = '${username}';
  `;
    const kappa = await database.get(kap);
    const shannu = `
  SELECT following_user_id FROM follower
  WHERE follower_user_id = ${kappa.user_id};
  
  
  `;
    const harika = await database.all(shannu);
    const surya = harika.map((each) => {
      return each.following_user_id;
    });
    const TWEET = `
  SELECT tweet_id FROM tweet 
  WHERE user_id IN (${surya});
  
  `;
    const TWEETING = await database.all(TWEET);
    const TRS = TWEETING.map((xx) => {
      return xx.tweet_id;
    });
    if (TRS.includes(parseInt(tweetId))) {
      const ALLU = `
      SELECT (user.name) AS name,
      (reply.reply) AS reply
      FROM user INNER JOIN reply ON user.user_id = reply.user_id
      WHERE reply.tweet_id = '${tweetId}';
      
      
      `;
      const ARJUN = await database.all(ALLU);
      response.send(convertLikedUserNameDBObjectToResponseObject1(ARJUN));
    } else {
      response.status(401);
      response.send("Invalid Request");
      console.log("Invalid Request");
    }
  }
);
//api 9
//api9
app.get("/user/tweets/", authentication, async (request, response) => {
  let { username } = request;
  const getUserIdQuery = `select user_id from user where username='${username}';`;
  const getUserId = await database.get(getUserIdQuery);
  console.log(getUserId);
  //get tweets made by user
  const getTweetIdsQuery = `select tweet_id from tweet where user_id=${getUserId.user_id};`;
  const getTweetIdsArray = await database.all(getTweetIdsQuery);
  const getTweetIds = getTweetIdsArray.map((eachId) => {
    return parseInt(eachId.tweet_id);
  });
  console.log(getTweetIds);
});
//api 10
app.post("/user/tweets/", authentication, async (request, response) => {
  const { username } = request;
  const { tweet } = request.body;
  const getUserIdQuery = `select user_id from user where username='${username}';`;
  const getUserId = await database.get(getUserIdQuery);
  const currentDate = new Date();
  const ttt = `
  INSERT INTO tweet(tweet,user_id,date_time)
  VALUES('${tweet}','${getUserId.user_id}','${currentDate}');

  
  
  `;
  const db = await database.run(ttt);
  response.send("Created a Tweet");
});

//api 11
app.delete("/tweets/:tweetId/", authentication, async (request, response) => {
  const { tweetId } = request.params;
  //console.log(tweetId);
  let { username } = request;
  const getUserIdQuery = `select user_id from user where username='${username}';`;
  const getUserId = await database.get(getUserIdQuery);
  //console.log(getUserId.user_id);
  //tweets made by the user
  const getUserTweetsListQuery = `select tweet_id from tweet where user_id=${getUserId.user_id};`;
  const getUserTweetsListArray = await database.all(getUserTweetsListQuery);
  const getUserTweetsList = getUserTweetsListArray.map((eachTweetId) => {
    return eachTweetId.tweet_id;
  });
  console.log(getUserTweetsList);
  if (getUserTweetsList.includes(parseInt(tweetId))) {
    const deleteTweetQuery = `delete from tweet where tweet_id=${tweetId};`;
    await database.run(deleteTweetQuery);
    response.send("Tweet Removed");
  } else {
    response.status(401);
    response.send("Invalid Request");
  }
});

//api 6
const api6Output = (tweetData, likesCount, replyCount) => {
  return {
    tweet: tweetData.tweet,
    likes: likesCount.likes,
    replies: replyCount.replies,
    dateTime: tweetData.date_time,
  };
};
app.get("/tweets/:tweetId/", authentication, async (request, response) => {
  const { username } = request;
  const { tweetId } = request.params;
  const kap = `
  SELECT user_id FROM user 
  WHERE username = '${username}';
  `;
  const kappa = await database.get(kap);
  const shannu = `
  SELECT following_user_id FROM follower
  WHERE follower_user_id = ${kappa.user_id};
  
  
  `;
  const harika = await database.all(shannu);
  const surya = harika.map((each) => {
    return each.following_user_id;
  });
  const TWEET = `
  SELECT tweet_id FROM tweet 
  WHERE user_id IN (${surya});
  
  `;
  const TWEETING = await database.all(TWEET);
  const TRS = TWEETING.map((xx) => {
    return xx.tweet_id;
  });
  if (TRS.includes(parseInt(tweetId))) {
    const likes_count_query = `select count(user_id) as likes from like where tweet_id=${tweetId};`;
    const likes_count = await database.get(likes_count_query);
    //console.log(likes_count);
    const reply_count_query = `select count(user_id) as replies from reply where tweet_id=${tweetId};`;
    const reply_count = await database.get(reply_count_query);
    // console.log(reply_count);
    const tweet_tweetDateQuery = `select tweet, date_time from tweet where tweet_id=${tweetId};`;
    const tweet_tweetDate = await database.get(tweet_tweetDateQuery);
    //console.log(tweet_tweetDate);
    response.send(api6Output(tweet_tweetDate, likes_count, reply_count));
  } else {
    response.status(401);
    response.send("Invalid Request");
    console.log("Invalid Request");
  }
});
module.exports = app;
