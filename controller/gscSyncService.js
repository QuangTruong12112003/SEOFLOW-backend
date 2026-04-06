const { google } = require("googleapis");
const handleID = require("../middleware/handleID");
const sequelize = require("../config/database");
const initModels = require("../models/init-models");
const models = initModels(sequelize);

function getOAuthClient(refreshToken) {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    ""
  );
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return oAuth2Client;
}

async function syncGSCBySite(site, date) {
  try {
    const startDate = date;
    const endDate = date;
    const siteUrl = site.url;
    const projectId = site.projectId;

    if (!site.project?.createBy_user?.refreshtoken) {
      console.log(`[SKIP] Dự án ${projectId} chưa xác thực GSC`);
      return;
    }

    const auth = getOAuthClient(site.project.createBy_user.refreshtoken);
    const gsc = google.searchconsole({ version: "v1", auth });

    const overviewRes = await gsc.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, dimensions: ["date"] },
    });

    const overview = (overviewRes.data.rows || [])[0];

    if (overview && overview.clicks != null && overview.impressions != null) {
      await models.gscdailyoverview.findOrCreate({
        where: { date, siteId: site.siteId },
        defaults: {
          id: handleID("GDO"),
          clicks: overview.clicks,
          impressions: overview.impressions,
          ctr: overview.ctr,
          position: overview.position,
        },
      });
    } else {
      console.log(`[SKIP] Không có dữ liệu overview cho ${siteUrl} (${date})`);
    }

    const queryRes = await gsc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 100,
      },
    });

    for (const row of queryRes.data.rows || []) {
      const query = row.keys[0];
      await models.gscquery.findOrCreate({
        where: { date, siteId: site.siteId, query },
        defaults: {
          id: handleID("GQY"),
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        },
      });
    }

    const pageRes = await gsc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["page"],
        rowLimit: 100,
      },
    });

    for (const row of pageRes.data.rows || []) {
      const pageUrl = row.keys[0];
      await models.gscpage.findOrCreate({
        where: { date, siteId: site.siteId, pageUrl },
        defaults: {
          id: handleID("GPG"),
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        },
      });
    }

    console.log(`Đồng bộ thành công cho ${siteUrl} (${date})`);
  } catch (error) {
    console.log(error);
  }
}

module.exports = { syncGSCBySite };
