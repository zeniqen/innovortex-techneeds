/**
 * The TechNeeds IGDTUW team, as published on the society's site.
 *
 * There is no API behind this page - the roster is baked into the
 * original site as well - so it lives here as data.
 *
 * Social links that were placeholders on the original site have been
 * dropped rather than reproduced as dead anchors.
 */

export interface TeamMember {
  name: string;
  position: string;
  avatar: string;
  links: {
    linkedin?: string;
    instagram?: string;
    x?: string;
  };
}

export interface TeamGroup {
  role: string;
  members: TeamMember[];
}

export const TEAM_GROUPS: TeamGroup[] = [
  {
    role: "Founders",
    members: [
      {
        name: "Vidushi Agarwal",
        position: "Founder",
        avatar: "https://res.cloudinary.com/dcec61lxq/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1724959866/WhatsApp_Image_2024-08-30_at_12.49.51_AM_cg7gmn.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/vidushi-agarwal-a95885256",
          instagram: "https://www.instagram.com/agarwal.vidu?igsh=MWI4d3Jvb2locmVvcQ==",
          x: "https://x.com/Vidushit143?t=4mzUEuIsF2nzUOrDhU_NGw&s=09",
        },
      },
      {
        name: "Sonam",
        position: "Founder",
        avatar: "https://res.cloudinary.com/dcec61lxq/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1724958308/IMG_20240430_003529_hk6mf6.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/sonam-yadav-a647ab258?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
          instagram: "https://www.instagram.com/sonam_ydv0303?igsh=MTRiMW50NnBoZmthdg==",
          x: "https://x.com/137_sonam3429?t=FKbrPncJzaVnEoLwZDYnzA&s=09",
        },
      },
      {
        name: "Sripriya Agarwal",
        position: "Founder",
        avatar: "https://res.cloudinary.com/dcec61lxq/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1724992510/b4eacac2-e23f-41b1-8ce1-69334b7dd27f_gztkzv.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/sripriya-agarwal-483475261",
          instagram: "https://www.instagram.com/sripriyaagarwal16?igsh=MXI3ejc3YXRzOXFhMA==",
          x: "https://x.com/Agarwa1Sripriya",
        },
      },
      {
        name: "Saie Prakhar Pawar",
        position: "Founder",
        avatar: "https://res.cloudinary.com/dcec61lxq/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1724958407/SaiePic_SquareFit_wh1gyn.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/saie-pawar-96b27a262",
          instagram: "https://instagram.com/_.saiee?igshid=MzMyNGUyNmU2YQ==",
          x: "https://x.com/Saie__Pawar",
        },
      },
      {
        name: "Avni Singh",
        position: "Founder",
        avatar: "https://res.cloudinary.com/dzwfmydmx/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1724998586/photo_6235583440917479616_x_vnz0tk.jpg",
        links: {},
      },
      {
        name: "Chanda Jha",
        position: "Founder",
        avatar: "https://res.cloudinary.com/dcec61lxq/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1724992377/58cc173a-2806-4dd4-9426-f37bafd91105_lekkdl.jpg",
        links: {},
      },
    ],
  },
  {
    role: "Leads",
    members: [
      {
        name: "Joysa Jain",
        position: "President",
        avatar: "https://res.cloudinary.com/dcec61lxq/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1724959131/IMG_7050_duy2oc.png",
        links: {
          linkedin: "https://www.linkedin.com/in/joysa-jain-86b589283/",
          instagram: "https://www.instagram.com/joysajain.21?igsh=MXhnM3Y1ZWloMGRmYw%3D%3D&utm_source=qr",
        },
      },
      {
        name: "Kashish Rastogi",
        position: "Vice President",
        avatar: "https://res.cloudinary.com/dcec61lxq/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1724959804/ef0car_tumptt.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/kashish-rastogi-7a189b27a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
          instagram: "https://www.instagram.com/brighttt4?igsh=MXV2cjViNGJ1aXN6Mw==",
          x: "https://x.com/KashishRastog19?t=hd_blcVaiJJtAWVsTtmrYw&s=09",
        },
      },
      {
        name: "Anushka Shanker",
        position: "Vice President",
        avatar: "https://res.cloudinary.com/dcec61lxq/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1724958476/Myphoto_hiq3gg.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/anushka-shanker-061b6a218/",
          instagram: "https://www.instagram.com/shankeranushka/",
          x: "https://x.com/ShankerAnu23798",
        },
      },
      {
        name: "Pari Gupta",
        position: "Treasurer",
        avatar: "https://res.cloudinary.com/dcec61lxq/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1724959125/Pari_wiuvo0.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/pari-gupta-168564289/",
          instagram: "https://www.instagram.com/parigupta9667/",
        },
      },
      {
        name: "Nandini Jain",
        position: "Mentorship Moderator",
        avatar: "https://res.cloudinary.com/dcec61lxq/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1724959748/me_oqxnuy.jpg",
        links: {
          linkedin: "www.linkedin.com/in/nandini-jain-00967028b",
          instagram: "https://www.instagram.com/nandinijain004/",
          x: "https://x.com/Nandini8409",
        },
      },
      {
        name: "Srishti Sudhakar",
        position: "Mentorship Moderator",
        avatar: "https://res.cloudinary.com/dzwfmydmx/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1756640728/Srishti_Sudhakar_Mentorhsip_Moderator_kcgfry.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/srishti-sudhakar-828250276?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
          instagram: "https://www.instagram.com/srishtisudhakar?igsh=MTk0b2puMGRhc3Fkcg==",
          x: "https://x.com/SrishtiSud41882?t=q6pU5EOqP0wXBp-HJaQJPQ&s=09",
        },
      },
      {
        name: "Areeba Khanam",
        position: "Team Manager",
        avatar: "https://res.cloudinary.com/dzwfmydmx/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1756640873/Areeba_Khanam_-_Team_manager_khs2hq.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/areeba-khan-70013128a",
          instagram: "https://www.instagram.com/al_.hayy?igsh=dnI3aDNtNDNtZml6",
        },
      },
      {
        name: "Shreya",
        position: "Outreach Secretary",
        avatar: "https://res.cloudinary.com/dzwfmydmx/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1756640977/Shreya_nt0i1v.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/shreya-kumari-2ba266269/",
        },
      },
    ],
  },
  {
    role: "Event Management",
    members: [
      {
        name: "Preeti",
        position: "Head",
        avatar: "https://res.cloudinary.com/dcec61lxq/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1724958832/IMG_20240823_183007_yl75hp.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/preeti-127953294",
          instagram: "https://www.instagram.com/p_r_e_e_t_i_5555?igsh=ZnhvcmxjYmlvanI0",
        },
      },
      {
        name: "Sonali Yadav",
        position: "Head",
        avatar: "https://res.cloudinary.com/dzwfmydmx/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1756650791/sonaliyadav_y80vsn.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/sonali-yadav17/",
          x: "https://x.com/Sonali_yadav17",
        },
      },
    ],
  },
  {
    role: "Media",
    members: [
      {
        name: "Vidhi Arora",
        position: "Head",
        avatar: "https://res.cloudinary.com/dzwfmydmx/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1756651106/Vidhi_mediateam_nu7tcf.jpg",
        links: {},
      },
      {
        name: "Riya",
        position: "Head",
        avatar: "https://res.cloudinary.com/dzwfmydmx/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1756651106/Riya_Media_Team_xyhytg.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/riya-yadav-b64a45289/",
          instagram: "https://www.instagram.com/rao_._riya/?hl=en",
          x: "https://x.com/RiyaYadav199924_",
        },
      },
    ],
  },
  {
    role: "Content",
    members: [
      {
        name: "Ekamjot Kaur",
        position: "Head",
        avatar: "https://res.cloudinary.com/dzwfmydmx/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1756653221/Ekamjot_Kaur_-_Content_Team_grk2sw.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/ekamjot-kaur-oberoi?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
          instagram: "https://www.instagram.com/_kaur.ek_?igsh=MXJnYmkwcDYydm8wNA==",
        },
      },
      {
        name: "Suparna Lahiri",
        position: "Head",
        avatar: "https://res.cloudinary.com/dzwfmydmx/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1756653221/Suparna_Lahiri_aefh5a.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/suparna-l-904636244",
          instagram: "https://www.instagram.com/itsokay_suparna",
          x: "https://twitter.com/itsokay_Suparna",
        },
      },
    ],
  },
  {
    role: "PR",
    members: [
      {
        name: "Niyati Mishra",
        position: "Head Coordinator",
        avatar: "https://res.cloudinary.com/dcec61lxq/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1724959554/niyatiTechneeds_q6xnde.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/prachi-b-0a17a625a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
        },
      },
      {
        name: "Istuti Jain",
        position: "Head",
        avatar: "https://res.cloudinary.com/dzwfmydmx/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1756664257/Istuti_PR_Team_g64mfr.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/istuti-jain-744b18298",
          instagram: "https://www.instagram.com/stuti_jn24",
          x: "https://x.com/stutijn24",
        },
      },
    ],
  },
  {
    role: "Sponsorship",
    members: [
      {
        name: "Shilpi Kumari",
        position: "Head",
        avatar: "https://res.cloudinary.com/dcec61lxq/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1724959317/DSC_0302_ozn1xo.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/shilpi-kumari-45696128a",
        },
      },
      {
        name: "Prakshi",
        position: "Head",
        avatar: "https://res.cloudinary.com/dcec61lxq/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1724959316/1000046863_vhojlw.jpg",
        links: {
          linkedin: "www.linkedin.com/in/prakshisagar",
        },
      },
    ],
  },
  {
    role: "Social Media",
    members: [
      {
        name: "Sakshi Sharma",
        position: "Head",
        avatar: "https://res.cloudinary.com/dzwfmydmx/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1756664258/Sakshi_sharma_media_team_xmltat.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/sakshi-sharma-188125277/",
          instagram: "https://www.instagram.com/sakshi.shhh/",
          x: "https://x.com/SakshiS57199303",
        },
      },
    ],
  },
  {
    role: "Tech Team",
    members: [
      {
        name: "Anjali",
        position: "Head",
        avatar: "https://res.cloudinary.com/dzwfmydmx/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_blue,b_rgb:262c35/v1756664636/Anjali_Dass_tech_team_mczybb.jpg",
        links: {
          linkedin: "https://www.linkedin.com/in/anjali-dass-002b5a31a/",
          instagram: "https://www.instagram.com/__anj__09/",
          x: "https://x.com/SakshiS57199303",
        },
      },
    ],
  },
];
