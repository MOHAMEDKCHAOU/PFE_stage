
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  password: 'password',
  role: 'role',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  stripeCustomerId: 'stripeCustomerId',
  stripeSubscriptionId: 'stripeSubscriptionId',
  subscriptionStatus: 'subscriptionStatus',
  subscriptionPlan: 'subscriptionPlan',
  currentPeriodEnd: 'currentPeriodEnd'
};

exports.Prisma.SubscriptionUsageScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  periodKey: 'periodKey',
  exportsCount: 'exportsCount',
  invitesCount: 'invitesCount'
};

exports.Prisma.SubscriptionPlanPriceScalarFieldEnum = {
  planKey: 'planKey',
  name: 'name',
  description: 'description',
  monthlyCents: 'monthlyCents',
  yearlyCents: 'yearlyCents',
  currency: 'currency',
  sortOrder: 'sortOrder',
  updatedAt: 'updatedAt'
};

exports.Prisma.AffiliateClientScalarFieldEnum = {
  id: 'id',
  affiliateUserId: 'affiliateUserId',
  clientUserId: 'clientUserId',
  createdAt: 'createdAt'
};

exports.Prisma.StudioClientInviteScalarFieldEnum = {
  id: 'id',
  tokenHash: 'tokenHash',
  affiliateUserId: 'affiliateUserId',
  inviteeEmail: 'inviteeEmail',
  expiresAt: 'expiresAt',
  acceptedAt: 'acceptedAt',
  revokedAt: 'revokedAt',
  clientUserId: 'clientUserId',
  createdAt: 'createdAt'
};

exports.Prisma.UserAssetScalarFieldEnum = {
  id: 'id',
  url: 'url',
  kind: 'kind',
  mimeType: 'mimeType',
  sizeBytes: 'sizeBytes',
  createdAt: 'createdAt',
  userId: 'userId'
};

exports.Prisma.IdentityProfileScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  type: 'type',
  bio: 'bio',
  headline: 'headline',
  avatar: 'avatar',
  cover: 'cover',
  theme: 'theme',
  socialLinks: 'socialLinks',
  hideBranding: 'hideBranding',
  ctaWebhookUrl: 'ctaWebhookUrl',
  ctaWebhookSecret: 'ctaWebhookSecret',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  userId: 'userId'
};

exports.Prisma.PortfolioProjectScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  image: 'image',
  year: 'year',
  isPublic: 'isPublic',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  identityId: 'identityId'
};

exports.Prisma.TestimonialScalarFieldEnum = {
  id: 'id',
  author: 'author',
  content: 'content',
  role: 'role',
  company: 'company',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  identityId: 'identityId'
};

exports.Prisma.CapsuleScalarFieldEnum = {
  id: 'id',
  title: 'title',
  objective: 'objective',
  layoutPreset: 'layoutPreset',
  isPublished: 'isPublished',
  editorHotspots: 'editorHotspots',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  identityId: 'identityId'
};

exports.Prisma.CapsuleOptionScalarFieldEnum = {
  id: 'id',
  label: 'label',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  capsuleId: 'capsuleId'
};

exports.Prisma.CapsuleBranchScalarFieldEnum = {
  id: 'id',
  optionId: 'optionId',
  headline: 'headline',
  description: 'description',
  cta: 'cta',
  proof: 'proof',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CapsuleSessionScalarFieldEnum = {
  id: 'id',
  capsuleId: 'capsuleId',
  startedAt: 'startedAt',
  endedAt: 'endedAt'
};

exports.Prisma.CapsuleEventScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  type: 'type',
  value: 'value',
  createdAt: 'createdAt'
};

exports.Prisma.FavoriteScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  capsuleId: 'capsuleId',
  createdAt: 'createdAt'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  content: 'content',
  isRead: 'isRead',
  createdAt: 'createdAt',
  identityId: 'identityId'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  title: 'title',
  body: 'body',
  isRead: 'isRead',
  link: 'link',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserAssetKind = exports.$Enums.UserAssetKind = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  MODEL_3D: 'MODEL_3D'
};

exports.Prisma.ModelName = {
  User: 'User',
  SubscriptionUsage: 'SubscriptionUsage',
  SubscriptionPlanPrice: 'SubscriptionPlanPrice',
  AffiliateClient: 'AffiliateClient',
  StudioClientInvite: 'StudioClientInvite',
  UserAsset: 'UserAsset',
  IdentityProfile: 'IdentityProfile',
  PortfolioProject: 'PortfolioProject',
  Testimonial: 'Testimonial',
  Capsule: 'Capsule',
  CapsuleOption: 'CapsuleOption',
  CapsuleBranch: 'CapsuleBranch',
  CapsuleSession: 'CapsuleSession',
  CapsuleEvent: 'CapsuleEvent',
  Favorite: 'Favorite',
  Message: 'Message',
  Notification: 'Notification'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
