import "server-only";
import * as file from "./store-file";
import supabase from "./store-supabase";

/**
 * Everything the site keeps about visitors goes through here, and nothing
 * outside the store files knows how it is stored.
 *
 * Supabase when SUPABASE_URL and SUPABASE_SECRET_KEY are set — production,
 * and any machine given the keys. Otherwise the JSON file in `.data/`, which
 * the e2e suite reads directly. RED_SKY_STORE=file|supabase overrides either
 * way, so a machine holding the keys can still run the suite locally.
 */

const wanted =
  process.env.RED_SKY_STORE ?? (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY ? "supabase" : "file");

// Typed as the file store, so a signature that drifts in the other fails to compile.
const impl: typeof file = wanted === "supabase" ? supabase : file;

export const storeName = wanted === "supabase" ? "supabase" : "file";

export const {
  findUserByEmail,
  getUser,
  createUser,
  getSession,
  putSession,
  deleteSession,
  mergeOwner,
  favoriteSnapshot,
  setFavorite,
  waitlistSnapshot,
  setWaitlist,
  getProfile,
  saveProfile,
  saveAddress,
  saveAvatar,
  readAvatar,
  removeAvatar,
  getCart,
  changeCart,
  placeOrder,
  getOrders,
  changeOrder,
  addStory,
  storiesWith,
  setStoryStatus,
  hasOrdered,
  placedOrders,
  setPasswordHash,
  endOtherSessions,
  exportOwner,
  closeAccount,
  subscribe,
  allowAttempt,
  clearAttempts,
  addMessage,
  setStandingAddress,
  recordShipment,
  getProducts,
  saveProduct,
  importProducts,
  productInUse,
  deleteProduct,
  saveProductImage,
  readProductImage,
  removeProductImage,
  getLots,
  saveLot,
  deleteLot,
  saveCertificate,
  readCertificate,
  allPlacedOrders,
  allStandingOrders,
  allMessages,
  logAdmin,
  adminLog,
} = impl;

export type {
  AdminLogEntry,
  AdminOrder,
  AdminStanding,
  ContactMessage,
  Kept,
  RetainedRecord,
  SessionRecord,
  User,
  WaitlistEntry,
} from "./store-file";
