// ─── components/profile/ProfileSkillsExperience.jsx ─────────────────────────
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { Sparkles, Briefcase, GraduationCap, Plus, Trash2, Edit2 } from 'lucide-react';

export function ProfileSkillsExperience({ profile, onUpdate }) {
  const [skillsText, setSkillsText] = useState((profile?.skills || []).join(', '));
  const [isEditingSkills, setIsEditingSkills] = useState(false);

  const [experienceList, setExperienceList] = useState(profile?.experience || []);
  const [newExp, setNewExp] = useState({ title: '', company: '', description: '', current: false });
  const [showAddExp, setShowAddExp] = useState(false);

  const [educationList, setEducationList] = useState(profile?.education || []);
  const [newEdu, setNewEdu] = useState({ school: '', degree: '', fieldOfStudy: '', gradYear: '' });
  const [showAddEdu, setShowAddEdu] = useState(false);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.put('/users/profile', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Profile details updated');
      setIsEditingSkills(false);
      setShowAddExp(false);
      setShowAddEdu(false);
      if (onUpdate) onUpdate(data.data);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleSaveSkills = (e) => {
    e.preventDefault();
    const skills = skillsText.split(',').map((s) => s.trim()).filter(Boolean);
    mutation.mutate({ skills });
  };

  const handleAddExperience = (e) => {
    e.preventDefault();
    if (!newExp.title || !newExp.company) return;
    const updated = [...experienceList, newExp];
    setExperienceList(updated);
    mutation.mutate({ experience: updated });
    setNewExp({ title: '', company: '', description: '', current: false });
  };

  const handleRemoveExperience = (index) => {
    const updated = experienceList.filter((_, i) => i !== index);
    setExperienceList(updated);
    mutation.mutate({ experience: updated });
  };

  const handleAddEducation = (e) => {
    e.preventDefault();
    if (!newEdu.school || !newEdu.degree) return;
    const updated = [...educationList, { ...newEdu, gradYear: Number(newEdu.gradYear) || undefined }];
    setEducationList(updated);
    mutation.mutate({ education: updated });
    setNewEdu({ school: '', degree: '', fieldOfStudy: '', gradYear: '' });
  };

  const handleRemoveEducation = (index) => {
    const updated = educationList.filter((_, i) => i !== index);
    setEducationList(updated);
    mutation.mutate({ education: updated });
  };

  return (
    <div className="space-y-6">
      {/* 1. Skills Section */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Skills & Focus Areas</span>
          </h3>
          <button
            onClick={() => setIsEditingSkills(!isEditingSkills)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            type="button"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditingSkills ? 'Cancel' : 'Edit Skills'}</span>
          </button>
        </div>

        {isEditingSkills ? (
          <form onSubmit={handleSaveSkills} className="space-y-3">
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="e.g. React, Node.js, JavaScript, Python, Communication..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring"
            />
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow"
            >
              Save Skills
            </button>
          </form>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {(profile?.skills || []).length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">No skills listed yet. Click Edit Skills to add skills.</p>
            ) : (
              (profile?.skills || []).map((skill, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 rounded-lg"
                >
                  {skill}
                </span>
              ))
            )}
          </div>
        )}
      </div>

      {/* 2. Experience Section */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-indigo-500" />
            <span>Professional Experience</span>
          </h3>
          <button
            onClick={() => setShowAddExp(!showAddExp)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            type="button"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Position</span>
          </button>
        </div>

        {showAddExp && (
          <form onSubmit={handleAddExperience} className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Job Title *"
                value={newExp.title}
                onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                required
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
              <input
                type="text"
                placeholder="Company Name *"
                value={newExp.company}
                onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                required
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
            </div>
            <textarea
              placeholder="Description or key achievements..."
              value={newExp.description}
              onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              rows={2}
            />
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg"
            >
              Add Experience
            </button>
          </form>
        )}

        <div className="space-y-3">
          {experienceList.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">No experience history listed.</p>
          ) : (
            experienceList.map((exp, idx) => (
              <div key={idx} className="flex items-start justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-xl text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{exp.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{exp.company}</p>
                  {exp.description && <p className="text-[11px] text-slate-400 mt-1">{exp.description}</p>}
                </div>
                <button
                  onClick={() => handleRemoveExperience(idx)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                  title="Remove"
                  type="button"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Education Section */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-indigo-500" />
            <span>Education Background</span>
          </h3>
          <button
            onClick={() => setShowAddEdu(!showAddEdu)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            type="button"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Education</span>
          </button>
        </div>

        {showAddEdu && (
          <form onSubmit={handleAddEducation} className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="School / University *"
                value={newEdu.school}
                onChange={(e) => setNewEdu({ ...newEdu, school: e.target.value })}
                required
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
              <input
                type="text"
                placeholder="Degree (e.g. B.S., B.Tech) *"
                value={newEdu.degree}
                onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                required
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
              <input
                type="text"
                placeholder="Field of Study (e.g. Computer Science)"
                value={newEdu.fieldOfStudy}
                onChange={(e) => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
              <input
                type="number"
                placeholder="Graduation Year (e.g. 2025)"
                value={newEdu.gradYear}
                onChange={(e) => setNewEdu({ ...newEdu, gradYear: e.target.value })}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg"
            >
              Add Education
            </button>
          </form>
        )}

        <div className="space-y-3">
          {educationList.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">No education background listed.</p>
          ) : (
            educationList.map((edu, idx) => (
              <div key={idx} className="flex items-start justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-xl text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</p>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{edu.school} {edu.gradYear && `· Class of ${edu.gradYear}`}</p>
                </div>
                <button
                  onClick={() => handleRemoveEducation(idx)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                  title="Remove"
                  type="button"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
